from __future__ import annotations
import glob
import importlib
import importlib.util
import inspect
import os
import sys
import time
import traceback
from typing import Any, Callable
import pytest
from pytest import _registry_fixtures

def resolve_fixture(name: str, available_fixtures: dict[str, Callable[..., Any]], teardown_stack: list[Any]) -> Any:
    if name not in available_fixtures:
        raise ValueError(f"Fixture '{name}' not found")
    fixture_fn = available_fixtures[name]
    sig = inspect.signature(fixture_fn)
    kwargs = {}
    for param_name in sig.parameters:
        kwargs[param_name] = resolve_fixture(param_name, available_fixtures, teardown_stack)

    res = fixture_fn(**kwargs)
    if inspect.isgenerator(res):
        val = next(res)
        teardown_stack.append(res)
        return val
    return res

def run_tests() -> int:
    start_time = time.time()
    base_dir = os.getcwd()
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

    # Load conftest.py if present
    conftest_path = os.path.join(base_dir, "tests", "conftest.py")
    if os.path.exists(conftest_path):
        spec = importlib.util.spec_from_file_location("tests.conftest", conftest_path)
        if spec and spec.loader:
            mod = importlib.util.module_from_spec(spec)
            sys.modules["tests.conftest"] = mod
            spec.loader.exec_module(mod)
            for attr_name in dir(mod):
                attr = getattr(mod, attr_name)
                if callable(attr) and getattr(attr, "__is_pytest_fixture__", False):
                    _registry_fixtures[attr_name] = attr

    args = sys.argv[1:]
    test_paths = []
    for arg in args:
        if arg.startswith("-"):
            continue
        if os.path.isfile(arg):
            test_paths.append(arg)
        elif os.path.isdir(arg):
            test_paths.extend(glob.glob(os.path.join(arg, "test_*.py")))

    if not test_paths:
        test_paths = glob.glob(os.path.join(base_dir, "tests", "test_*.py"))

    test_paths.sort()
    passed = 0
    failed = 0
    errors: list[tuple[str, str]] = []

    for path in test_paths:
        rel_path = os.path.relpath(path, base_dir)
        module_name = rel_path.replace(os.path.sep, ".").replace(".py", "")
        spec = importlib.util.spec_from_file_location(module_name, path)
        if not spec or not spec.loader:
            continue
        test_mod = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = test_mod
        try:
            spec.loader.exec_module(test_mod)
        except Exception:
            print(f"ERROR loading {rel_path}:")
            traceback.print_exc()
            failed += 1
            continue

        mod_fixtures = dict(_registry_fixtures)
        for attr_name in dir(test_mod):
            attr = getattr(test_mod, attr_name)
            if callable(attr) and getattr(attr, "__is_pytest_fixture__", False):
                mod_fixtures[attr_name] = attr

        test_funcs = [
            (name, getattr(test_mod, name))
            for name in dir(test_mod)
            if name.startswith("test_") and callable(getattr(test_mod, name))
        ]

        for test_name, test_fn in test_funcs:
            teardown_stack: list[Any] = []
            test_id = f"{rel_path}::{test_name}"
            try:
                sig = inspect.signature(test_fn)
                kwargs = {}
                for param_name in sig.parameters:
                    kwargs[param_name] = resolve_fixture(param_name, mod_fixtures, teardown_stack)
                test_fn(**kwargs)
                print(f"{test_id} \033[92mPASSED\033[0m")
                passed += 1
            except Exception as e:
                print(f"{test_id} \033[91mFAILED\033[0m")
                failed += 1
                errors.append((test_id, traceback.format_exc()))
            finally:
                for gen in reversed(teardown_stack):
                    try:
                        next(gen)
                    except StopIteration:
                        pass
                    except Exception:
                        pass

    duration = time.time() - start_time
    print()
    if errors:
        print("FAILURES:")
        for test_id, tb in errors:
            print(f"=== {test_id} ===")
            print(tb)
        print(f"==================== \033[91m{failed} failed\033[0m, \033[92m{passed} passed\033[0m in {duration:.2f}s ====================")
        return 1
    else:
        print(f"==================== \033[92m{passed} passed\033[0m in {duration:.2f}s ====================")
        return 0

if __name__ == "__main__":
    sys.exit(run_tests())
