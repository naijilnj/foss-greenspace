import geopandas as gpd
import osmnx as ox
import requests
from shapely.geometry import Point, LineString, Polygon
import logging


def fetch_place_polygon(place_name: str) -> gpd.GeoDataFrame:
    """Return a GeoDataFrame polygon for the given place name.

    Provides a clearer error if geocoding is unavailable.
    """
    try:
        g = ox.geocode_to_gdf(place_name)
        return g
    except AttributeError:
        raise RuntimeError("osmnx is missing 'geocode_to_gdf' — please install/upgrade osmnx (e.g. pip install 'osmnx>=1.3')")
    except Exception as exc:
        raise RuntimeError(f"Failed to geocode place '{place_name}': {exc}")


def _call_geometries_from_place(place_name: str, tags: dict) -> gpd.GeoDataFrame:
    """Try multiple osmnx entry points to fetch geometries for broad compatibility."""
    # preferred direct function
    try:
        if hasattr(ox, "geometries_from_place"):
            return ox.geometries_from_place(place_name, tags)
    except Exception:
        pass

    # sometimes functions are under the geometries submodule
    geom_mod = getattr(ox, "geometries", None)
    if geom_mod is not None and hasattr(geom_mod, "geometries_from_place"):
        try:
            return geom_mod.geometries_from_place(place_name, tags)
        except Exception:
            pass

    # fallback: geocode to polygon and try geometries_from_polygon
    try:
        place_gdf = fetch_place_polygon(place_name)
        polygon = place_gdf.geometry.iloc[0]
        if hasattr(ox, "geometries_from_polygon"):
            return ox.geometries_from_polygon(polygon, tags)
        if geom_mod is not None and hasattr(geom_mod, "geometries_from_polygon"):
            return geom_mod.geometries_from_polygon(polygon, tags)
    except Exception:
        pass

    raise RuntimeError("osmnx does not expose a compatible 'geometries_from_place' API. Please upgrade osmnx (pip install 'osmnx>=1.3')")


def fetch_green_features(place_name: str) -> gpd.GeoDataFrame:
    """Fetch common green-space features for a place using OSM tags.

    Returns an empty GeoDataFrame if nothing found. Raises RuntimeError with
    actionable instructions if osmnx lacks the required API surface.
    """
    tags = {
        "leisure": ["park", "garden"],
        "landuse": ["grass", "forest", "meadow", "village_green", "orchard"],
        "natural": ["wood", "scrub"]
    }

    try:
        gdf = _call_geometries_from_place(place_name, tags)
    except RuntimeError as re:
        # osmnx not available or incompatible — fall back to Overpass API
        logging.warning("osmnx geometries API unavailable, falling back to Overpass: %s", re)
        try:
            gdf = _overpass_fetch_green(place_name, tags)
        except Exception as exc:
            raise RuntimeError(f"Failed to fetch green features from Overpass: {exc}")
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch green features from OSM: {exc}")

    if gdf is None or gdf.empty:
        return gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs="EPSG:4326")
    # ensure geometry column and CRS
    gdf = gdf[gdf.geometry.notnull()].copy()
    if gdf.crs is None:
        gdf.set_crs(epsg=4326, inplace=True)
    return gdf


def _overpass_fetch_green(place_name: str, tags: dict) -> gpd.GeoDataFrame:
    """Fetch green features using Overpass API as a fallback.

    Uses the place polygon bounding box to query Overpass and returns a GeoDataFrame
    in EPSG:4326.
    """
    # get place polygon/bbox
    place_gdf = None
    try:
        place_gdf = fetch_place_polygon(place_name)
    except Exception:
        place_gdf = None

    if place_gdf is None or place_gdf.empty:
        raise RuntimeError("Could not determine place polygon for Overpass query")

    # get bbox in lat/lon (south, west, north, east)
    geom = place_gdf.geometry.iloc[0]
    geom4326 = gpd.GeoSeries([geom], crs=place_gdf.crs).to_crs(epsg=4326).geometry.iloc[0]
    minx, miny, maxx, maxy = geom4326.bounds
    south, west, north, east = miny, minx, maxy, maxx

    # build Overpass QL
    o_tags = []
    if "leisure" in tags:
        o_tags.append(("leisure", tags["leisure"]))
    if "landuse" in tags:
        o_tags.append(("landuse", tags["landuse"]))
    if "natural" in tags:
        o_tags.append(("natural", tags["natural"]))

    # Build Overpass QL using two-step formatting to avoid accidental f-string evaluation
    q = "[out:json][timeout:25];("
    for k, vals in o_tags:
        pattern = "|".join(vals)
        # first substitute k and pattern, leave bbox placeholders as {{s}},{{w}},{{n}},{{e}}
        way_template = 'way["{k}"~"{pattern}"]({{s}},{{w}},{{n}},{{e}});'.format(k=k, pattern=pattern)
        rel_template = 'relation["{k}"~"{pattern}"]({{s}},{{w}},{{n}},{{e}});'.format(k=k, pattern=pattern)
        q += way_template + rel_template
    q += ");out geom;"

    # now safely replace bbox placeholders with numeric values
    q = q.format(s=str(south), w=str(west), n=str(north), e=str(east))

    url = "https://overpass-api.de/api/interpreter"
    resp = requests.post(url, data={"data": q}, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    geoms = []
    for el in data.get("elements", []):
        geom_pts = el.get("geometry")
        if not geom_pts:
            continue
        coords = [(p["lon"], p["lat"]) for p in geom_pts]
        geom_obj = None
        # closed ways -> polygon
        if len(coords) >= 4 and coords[0] == coords[-1]:
            try:
                geom_obj = Polygon(coords)
            except Exception:
                geom_obj = LineString(coords)
        elif len(coords) >= 2:
            geom_obj = LineString(coords)
        else:
            # fallback to point
            geom_obj = Point(coords[0])

        geoms.append(geom_obj)

    if not geoms:
        return gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs="EPSG:4326")

    gdf = gpd.GeoDataFrame(geometry=geoms, crs="EPSG:4326")
    return gdf
