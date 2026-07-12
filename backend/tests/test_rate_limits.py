import ast
from pathlib import Path


def test_all_post_routes_have_rate_limits():
    """Ensure all POST routes in main.py have a rate limit applied."""
    routes_file = Path(__file__).parent.parent / "app" / "routes" / "main.py"
    with open(routes_file, encoding="utf-8") as f:
        tree = ast.parse(f.read())

    for node in ast.walk(tree):
        if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
            is_post_route = False
            for dec in node.decorator_list:
                if isinstance(dec, ast.Call) and getattr(dec.func, "value", None):
                    # Check for @router.post(...)
                    if getattr(dec.func.value, "id", None) == "router" and getattr(dec.func, "attr", None) == "post":
                        is_post_route = True

            if is_post_route:
                has_limiter = False
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Call) and getattr(dec.func, "value", None):
                        # Check for @limiter.limit(...)
                        if getattr(dec.func.value, "id", None) == "limiter" and getattr(dec.func, "attr", None) == "limit":
                            has_limiter = True

                assert has_limiter, f"Security Regression: Route '{node.name}' in main.py is missing a @limiter.limit() decorator!"
