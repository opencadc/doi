# app/utils/paths.py
from app.config import ADES_PYTHON_BIN


def get_converter_path(converter_name, extensions=None):
    """
    Get the path to a converter script, trying different possible filenames.

    Args:
        converter_name: Base name of the converter script
        extensions: List of extensions to try (defaults to ["py", ""])

    Returns:
        Path object to the converter script, or None if not found
    """
    if extensions is None:
        extensions = [".py", ""]

    for ext in extensions:
        path = ADES_PYTHON_BIN / f"{converter_name}{ext}"
        if path.exists():
            return path

    return None
