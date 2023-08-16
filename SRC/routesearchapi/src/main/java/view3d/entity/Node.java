package view3d.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Node implements Serializable {
	private static final long serialVersionUID = 1L;
	/** ノードID*/
	@Id
	@Column(name="node_id")
	private int nodeId;
	/** 距離　*/
	@Column(name="distance")
	private double distance;
}
