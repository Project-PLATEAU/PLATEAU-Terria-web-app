package view3d.entity;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class ResponseError implements Serializable {
	/** シリアルバージョンUID */
	private static final long serialVersionUID = 1L;

	/** ステータス */
	private int status;

	/** メッセージ */
	private String message;
}
