import geopandas as gpd
from shapely.geometry import box
from shapely.ops import unary_union
import numpy as np


def compute_green_percent(place_gdf: gpd.GeoDataFrame, green_gdf: gpd.GeoDataFrame) -> dict:
    """Compute green area percentage inside the place polygon.

    Returns dict with areas in m^2 and percentage.
    """
    place = place_gdf.unary_union
    if place is None or place.is_empty:
        return {"area_place_m2": 0, "area_green_m2": 0, "green_percent": 0}

    # Clip green features to the place
    try:
        green_clip = gpd.clip(green_gdf, place)
    except Exception:
        green_clip = green_gdf

    # Project to metric CRS for area (Web Mercator for simplicity)
    place_proj = gpd.GeoSeries([place], crs=place_gdf.crs).to_crs(epsg=3857)
    green_proj = green_clip.to_crs(epsg=3857) if not green_clip.empty else gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs=place_gdf.crs).to_crs(epsg=3857)

    area_place = float(place_proj.geometry.area.sum())
    area_green = float(green_proj.geometry.area.sum())
    percent = (area_green / area_place * 100) if area_place > 0 else 0.0

    return {"area_place_m2": area_place, "area_green_m2": area_green, "green_percent": percent}


def suggest_low_green_cells(place_gdf: gpd.GeoDataFrame, green_gdf: gpd.GeoDataFrame, cell_size_m: int = 500, threshold_percent: float = 10.0) -> gpd.GeoDataFrame:
    """Return grid cells (as GeoDataFrame) inside place with green percent below threshold.

    Grid is built in EPSG:3857 (meters) then returned in the place CRS.
    """
    place = place_gdf.unary_union
    if place is None or place.is_empty:
        return gpd.GeoDataFrame(columns=["geometry", "green_percent"], geometry="geometry")

    g_place = gpd.GeoDataFrame(geometry=[place], crs=place_gdf.crs).to_crs(epsg=3857)
    minx, miny, maxx, maxy = g_place.total_bounds

    xs = np.arange(minx, maxx, cell_size_m)
    ys = np.arange(miny, maxy, cell_size_m)
    cells = []
    for x in xs:
        for y in ys:
            cells.append(box(x, y, x + cell_size_m, y + cell_size_m))

    grid = gpd.GeoDataFrame(geometry=cells, crs=3857)
    grid = gpd.overlay(grid, g_place.to_crs(epsg=3857), how="intersection")

    # Prepare green features in same metric CRS
    green_proj = green_gdf.to_crs(epsg=3857) if not green_gdf.empty else gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs=place_gdf.crs).to_crs(epsg=3857)

    records = []
    for _, cell in grid.iterrows():
        cell_geom = cell.geometry
        area_cell = cell_geom.area
        if area_cell == 0:
            continue
        intersects = green_proj[green_proj.intersects(cell_geom)]
        if not intersects.empty:
            # compute intersection area
            inter_area = float(intersects.geometry.intersection(cell_geom).area.sum())
        else:
            inter_area = 0.0
        percent = (inter_area / area_cell * 100)
        records.append({"geometry": cell_geom, "green_percent": percent})

    res = gpd.GeoDataFrame(records, crs=3857)
    # filter low-green
    low = res[res["green_percent"] < threshold_percent]
    return low.to_crs(place_gdf.crs)
