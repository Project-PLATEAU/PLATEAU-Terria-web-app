package view3d.lib;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

import org.postgis.Geometry;

@Converter
public class GeometryObjectConverter implements AttributeConverter<Geometry,Geometry> {
	@Override
    public Geometry convertToDatabaseColumn(Geometry x) {
        return x;
    }
 
    @Override
    public Geometry convertToEntityAttribute(Geometry y) {
        return y;
    }
}
