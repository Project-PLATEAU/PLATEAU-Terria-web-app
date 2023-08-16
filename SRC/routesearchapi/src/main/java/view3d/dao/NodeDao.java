package view3d.dao;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.transaction.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import view3d.entity.Node;

@Transactional
public class NodeDao {
	/** Entityマネージャファクトリ */
	protected EntityManagerFactory emf;

	/** LOGGER */
	private static final Logger LOGGER = LoggerFactory.getLogger(NodeDao.class);

	/**
	 * コンストラクタ
	 * 
	 * @param emf Entityマネージャファクトリ
	 */
	public NodeDao(EntityManagerFactory emf) {
		this.emf = emf;
	}

	/**
	 * 最近ノードを取得する
	 * @param wkt WKT文字列
	 * @param limit 取得上限
	 * @param viewEPSG リクエスト・レスポンス座標系
	 * @param dataEPSG データ座標系
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public List<Node> getNearNode(String wkt, int limit, int viewEPSG, int dataEPSG) {

		LOGGER.debug("最近ノード取得 開始");
		EntityManager em = null;
		try {
			em = emf.createEntityManager();
			String sql = "SELECT " + //
					"CAST(node_id AS integer) AS node_id" + //
					", ST_Distance(" + //
					"t1.geom" + //
					", ST_Transform(ST_GeomFromText(:wkt, :viewEPSG), :dataEPSG)) AS distance " + //
					"FROM " + //
					"node_3d AS t1 " + //
					"ORDER BY distance asc";
			return em.createNativeQuery(sql, Node.class).setParameter("wkt", wkt)
					.setParameter("viewEPSG", viewEPSG).setParameter("dataEPSG", dataEPSG).setMaxResults(limit)
					.getResultList();
		} finally {
			if (em != null) {
				em.close();
			}
			LOGGER.debug("最近ノード取得 終了");
		}
	}
}
