import streamlit as st
from greengrid.osm_utils import fetch_place_polygon, fetch_green_features
from greengrid.analysis import compute_green_percent, suggest_low_green_cells
import folium
from streamlit_folium import st_folium
import geopandas as gpd


st.set_page_config(page_title="GreenGrid TN — Demo", layout="wide")

st.title("GreenGrid TN — Open Urban Green-space Analyzer (demo)")

place = st.text_input("Place name (e.g. Chennai, Tamil Nadu, India)", "Chennai, Tamil Nadu, India")
cell_size = st.number_input("Grid cell size (meters)", value=500, step=100)

if st.button("Analyze"):
    with st.spinner("Fetching OSM data — this can take a few seconds"):
        try:
            place_gdf = fetch_place_polygon(place)
            green_gdf = fetch_green_features(place)
        except RuntimeError as e:
            st.error(str(e))
            st.stop()

    if place_gdf is None or place_gdf.empty:
        st.error("Place not found. Try a different query.")
    else:
        metrics = compute_green_percent(place_gdf, green_gdf)
        st.metric("Green cover %", f"{metrics['green_percent']:.2f}%")
        st.write(f"Place area (m²): {metrics['area_place_m2']:.0f}")
        st.write(f"Green area (m²): {metrics['area_green_m2']:.0f}")

        # Suggest low-green cells
        low = suggest_low_green_cells(place_gdf, green_gdf, cell_size_m=cell_size)

        # Build folium map
        center = [place_gdf.geometry.iloc[0].centroid.y, place_gdf.geometry.iloc[0].centroid.x]
        m = folium.Map(location=center, zoom_start=12)

        if not green_gdf.empty:
            folium.GeoJson(green_gdf.to_json(), name="Green areas",
                           style_function=lambda x: {"fillColor": "green", "color": "green", "weight": 1, "fillOpacity": 0.4}).add_to(m)

        if not low.empty:
            folium.GeoJson(low.to_crs(epsg=4326).to_json(), name="Suggested low-green zones",
                           style_function=lambda x: {"fillColor": "red", "color": "red", "weight": 1, "fillOpacity": 0.2}).add_to(m)

        folium.LayerControl().add_to(m)

        st_folium(m, width=900)

        st.success("Analysis complete — review map and metrics.")
