package view3d.form;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Data
public class RouteSearchResultForm implements Serializable  {
	private static final long serialVersionUID = 1L;
	
	@ApiModelProperty(value = "経路探索結果GeoJSON")
	private String result;
	
	@ApiModelProperty(value = "結果の優先度", example = "1")
	private Integer resultPriority;
	
	@ApiModelProperty(value = "距離", example = "1.2239")
	private Double distance;
}
