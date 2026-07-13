"""Structural tests: every POST route in app/routes/ must have a rate limit."""

import ast
from pathlib import Path


def test_all_post_routes_have_rate_limits():
    """Ensure every POST route across all route modules has a @limiter.limit() decorator.

    Walks every .py file in app/routes/ (excluding __init__.py and auth.py, which
    has no AI-calling POST routes) so that this coverage automatically extends to
    any new route file added in the future.
    """
    routes_dir = Path(__file__).parent.parent / "app" / "routes"
    route_files = [
        f for f in routes_dir.glob("*.py")
        if f.name not in ("__init__.py", "auth.py")
    ]

    assert route_files, "No route files found — check the routes directory path"

    for route_file in route_files:
        with open(route_file, encoding="utf-8") as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):
            if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
                is_post_route = False
                for dec in node.decorator_list:
                    if (
                        isinstance(dec, ast.Call)
                        and isinstance(dec.func, ast.Attribute)
                        and isinstance(dec.func.value, ast.Name)
                        and dec.func.value.id == "router"
                        and dec.func.attr == "post"
                    ):
                        is_post_route = True

                if is_post_route:
                    has_limiter = False
                    for dec in node.decorator_list:
                        if (
                            isinstance(dec, ast.Call)
                            and isinstance(dec.func, ast.Attribute)
                            and isinstance(dec.func.value, ast.Name)
                            and dec.func.value.id == "limiter"
                            and dec.func.attr == "limit"
                        ):
                            has_limiter = True

                    assert has_limiter, (
                        f"Security Regression: Route '{node.name}' in "
                        f"{route_file.name} is missing a @limiter.limit() decorator!"
                    )
