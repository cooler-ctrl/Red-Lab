from __future__ import annotations
import inspect
from typing import Any, Callable

_registry_fixtures: dict[str, Callable[..., Any]] = {}

def fixture(func: Callable[..., Any] | None = None, scope: str = "function") -> Any:
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        fn.__is_pytest_fixture__ = True
        _registry_fixtures[fn.__name__] = fn
        return fn

    if func is not None:
        return decorator(func)
    return decorator

class _Mark:
    def __getattr__(self, name: str) -> Any:
        def marker(*args: Any, **kwargs: Any) -> Callable[..., Any]:
            def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
                return fn
            return decorator
        return marker

mark = _Mark()

class raises:
    def __init__(self, expected_exc: type[BaseException]):
        self.expected_exc = expected_exc
        self.value: BaseException | None = None

    def __enter__(self) -> raises:
        return self

    def __exit__(self, exc_type: type[BaseException] | None, exc_val: BaseException | None, exc_tb: Any) -> bool:
        if exc_type is None:
            raise AssertionError(f"Expected exception {self.expected_exc.__name__} but none was raised")
        if issubclass(exc_type, self.expected_exc):
            self.value = exc_val
            return True
        return False
