package ca.nrc.cadc.doi;

public enum DOISettingsType {
    DOI("DOI"), ALT_DOI("AlternativeDOI");

    private String value;

    DOISettingsType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
