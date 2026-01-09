import asyncio

from app.utils.validation import validate_ades_xml


def test_external_entities_disabled(tmp_path):
    xml_content = """<?xml version='1.0'?>
<!DOCTYPE ades [<!ENTITY xxe SYSTEM 'file:///does/not/exist'>]>
<ades>&xxe;</ades>
"""
    xml_file = tmp_path / "xxe.xml"
    xml_file.write_text(xml_content)

    results = asyncio.run(validate_ades_xml(str(xml_file), "submit"))

    assert isinstance(results, list)
    assert results
    # Parsing should not fail with a general error
    assert results[0].get("type") != "error"
