from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from greengrid.osm_utils import fetch_place_polygon, fetch_green_features
from greengrid.analysis import compute_green_percent, suggest_low_green_cells
import geopandas as gpd
import os


app = FastAPI(title="GreenGrid TN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeParams(BaseModel):
    place: str
    cell_size_m: int = 500
    threshold_percent: float = 10.0


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/city")
def get_city(place: str):
    try:
        place_gdf = fetch_place_polygon(place)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if place_gdf is None or place_gdf.empty:
        raise HTTPException(status_code=404, detail="Place not found")

    geom = place_gdf.to_crs(epsg=4326)
    return {"place_geojson": geom.to_json()}


@app.get("/analyze")
def analyze(place: str, cell_size_m: int = 500, threshold_percent: float = 10.0):
    try:
        place_gdf = fetch_place_polygon(place)
        green_gdf = fetch_green_features(place)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if place_gdf is None or place_gdf.empty:
        raise HTTPException(status_code=404, detail="Place not found")

    metrics = compute_green_percent(place_gdf, green_gdf)
    low = suggest_low_green_cells(place_gdf, green_gdf, cell_size_m=cell_size_m, threshold_percent=threshold_percent)

    low_geojson = low.to_crs(epsg=4326).to_json() if not low.empty else None
    green_geojson = green_gdf.to_crs(epsg=4326).to_json() if not green_gdf.empty else None

    return {
        "metrics": metrics,
        "green_geojson": green_geojson,
        "low_green_geojson": low_geojson,
    }


@app.post("/recommend")
def recommend(params: AnalyzeParams):
    try:
        place_gdf = fetch_place_polygon(params.place)
        green_gdf = fetch_green_features(params.place)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    metrics = compute_green_percent(place_gdf, green_gdf)
    low = suggest_low_green_cells(place_gdf, green_gdf, cell_size_m=params.cell_size_m, threshold_percent=params.threshold_percent)

    # Simple recommendation: return centroids of low-green cells
    if low.empty:
        return {"recommendations": [], "metrics": metrics}

    centroids = low.to_crs(epsg=3857).geometry.centroid.to_crs(epsg=4326)
    recs = [{"lat": c.y, "lon": c.x} for c in centroids]

    return {"recommendations": recs, "metrics": metrics}


# Serve frontend static files if built
frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if os.path.exists(frontend_dist):
    app.mount("/static", StaticFiles(directory=frontend_dist, html=False), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(frontend_dist, 'index.html'))

    @app.get("/{path:path}")
    def serve_frontend_path(path: str):
        file_path = os.path.join(frontend_dist, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, 'index.html'))

