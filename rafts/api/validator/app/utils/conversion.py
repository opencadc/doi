# app/utils/conversion.py
import os
import asyncio
import sys
from lxml import etree
from app.config import ADES_PYTHON_BIN, logger
from app.utils.paths import get_converter_path


async def convert_psv_to_xml(psv_file_path, xml_output_path):
    """
    Convert a PSV file to XML format using the ADES converter.

    Args:
        psv_file_path: Path to the PSV file
        xml_output_path: Path to save the resulting XML file

    Returns:
        Tuple of (success, message)
    """
    try:
        # Look for the psvtoxml script
        converter = get_converter_path("psvtoxml")

        if converter is None:
            return False, "PSV to XML converter script not found"

        logger.info(f"Converting PSV to XML: {psv_file_path} -> {xml_output_path}")

        # Set up environment variables
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{str(ADES_PYTHON_BIN)}:{env.get('PYTHONPATH', '')}"

        # Run the conversion script asynchronously
        process = await asyncio.create_subprocess_exec(
            sys.executable,
            str(converter),
            str(psv_file_path),
            str(xml_output_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
        stdout_bytes, stderr_bytes = await process.communicate()
        result_stdout = stdout_bytes.decode()
        result_stderr = stderr_bytes.decode()
        result_returncode = process.returncode

        # Check if the conversion was successful and the output parses
        if (
            result_returncode == 0
            and os.path.exists(xml_output_path)
            and not (result_stdout.strip() or result_stderr.strip())
        ):
            try:
                etree.parse(xml_output_path)
            except Exception as e:  # includes XMLSyntaxError
                if os.path.exists(xml_output_path):
                    os.unlink(xml_output_path)
                return False, f"PSV to XML conversion produced invalid XML: {str(e)}"
            return True, "PSV to XML conversion successful"
        else:
            error_message = result_stdout + "\n" + result_stderr
            return False, f"PSV to XML conversion failed: {error_message}"

    except Exception as e:
        logger.error(f"PSV to XML conversion error: {str(e)}")
        return False, f"Error during PSV to XML conversion: {str(e)}"


async def convert_mpc_to_xml(mpc_file_path, xml_output_path):
    """
    Convert an MPC 80-column format file to XML using the ADES converter.

    Args:
        mpc_file_path: Path to the MPC 80-column file
        xml_output_path: Path to save the resulting XML file

    Returns:
        Tuple of (success, message)
    """
    try:
        # Look for the mpc80coltoxml script
        converter = get_converter_path("mpc80coltoxml")

        if converter is None:
            return False, "MPC 80-column to XML converter script not found"

        logger.info(
            f"Converting MPC 80-column to XML: {mpc_file_path} -> {xml_output_path}"
        )

        # Set up environment variables
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{str(ADES_PYTHON_BIN)}:{env.get('PYTHONPATH', '')}"

        # Run the conversion script asynchronously
        process = await asyncio.create_subprocess_exec(
            sys.executable,
            str(converter),
            str(mpc_file_path),
            str(xml_output_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
        stdout_bytes, stderr_bytes = await process.communicate()
        result_stdout = stdout_bytes.decode()
        result_stderr = stderr_bytes.decode()
        result_returncode = process.returncode

        # Check if the conversion was successful and the output parses
        if (
            result_returncode == 0
            and os.path.exists(xml_output_path)
            and not (result_stdout.strip() or result_stderr.strip())
        ):
            try:
                etree.parse(xml_output_path)
            except Exception as e:  # includes XMLSyntaxError
                if os.path.exists(xml_output_path):
                    os.unlink(xml_output_path)
                return False, (
                    f"MPC 80-column to XML conversion produced invalid XML: {str(e)}"
                )
            return True, "MPC 80-column to XML conversion successful"
        else:
            error_message = result_stdout + "\n" + result_stderr
            return False, f"MPC 80-column to XML conversion failed: {error_message}"

    except Exception as e:
        logger.error(f"MPC 80-column to XML conversion error: {str(e)}")
        return False, f"Error during MPC 80-column to XML conversion: {str(e)}"
