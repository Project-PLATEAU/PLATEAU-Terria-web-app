package view3d.dao;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.transaction.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import view3d.entity.RouteSearch;

@Transactional
public class RouteSearchDao {

	/** Entityマネージャファクトリ */
	protected EntityManagerFactory emf;

	/** LOGGER */
	private static final Logger LOGGER = LoggerFactory.getLogger(RouteSearchDao.class);

	/**
	 * コンストラクタ
	 * 
	 * @param emf Entityマネージャファクトリ
	 */
	public RouteSearchDao(EntityManagerFactory emf) {
		this.emf = emf;
	}

	/** エッジ取得SQL:共通 */
	private static final String route_search_edge = "SELECT id AS seq, cast(link_id AS integer) AS id, cast(start_id AS integer) AS source, cast(end_id AS integer) AS target, $edge_column AS cost FROM link_3d WHERE link_id is not NULL";
	/** エッジ取得SQL: 車いす条件 */
	private static final String condition_wheelchair = " AND (route_type <> 5 AND route_type <> 6)";
	/** エッジ取得SQL: 視覚障害者条件 */
	private static final String condition_brail = " AND route_type <> 3";

	/**
	 * エッジつきデータで経路探索
	 * @param startNodeId
	 * @param endNodeId
	 * @param condition
	 * @param resSRID
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public List<RouteSearch> searchRouteWithCost(int startNodeId, int endNodeId, int condition, int resSRID) {
		LOGGER.debug("経路探索 開始");
		EntityManager em = null;
		try {
			em = emf.createEntityManager();
			String sql = "" + //
					"SELECT ROW_NUMBER() OVER(ORDER BY united.geom ASC) AS result_id, :priority AS priority, " + //
					"ST_AsGeoJSON(ST_Transform(united.geom, :srid)) AS geojson, ST_Length(united.geom) AS distance FROM"
					+ //
					"( " + //
					" SELECT" + //
					" ST_LineMerge(ST_UNION(res.geom)) AS geom " + //
					"FROM" + //
					"( " + //
					"SELECT " + //
					"t1.seq" + //
					", t1" + //
					", edge" + //
					", t2.geom as geom " + //
					"FROM " + //
					"pgr_dijkstra(" + //
					":edge_sql" + //
					", :start_node_id" + //
					", :end_node_id" + //
					", directed \\:= false" + //
					") AS t1 " + //
					"INNER JOIN link_3d AS t2 " + //
					"ON t1.edge = cast(t2.link_id AS integer)" + //
					") as res" + //
					") AS united";
			String edgeColumn = "distance";
			if (condition == 2) {
				edgeColumn = "cost_wheelchair";
			} else if (condition == 3) {
				edgeColumn = "cost_elderly";
			} else if (condition == 4) {
				edgeColumn = "cost_brail";
			}
			String edgeSql = route_search_edge.replace("$edge_column", edgeColumn);
			if (condition == 2) {
				edgeSql = edgeSql + condition_wheelchair;
			} else if (condition == 4) {
				edgeSql = edgeSql + condition_brail;
			}
			return em.createNativeQuery(sql, RouteSearch.class).setParameter("edge_sql", edgeSql)
					.setParameter("start_node_id", startNodeId).setParameter("end_node_id", endNodeId)
					.setParameter("srid", resSRID).setParameter("priority", 1).getResultList();
		} finally {
			if (em != null) {
				em.close();
			}
			LOGGER.debug("経路探索 終了");
		}
	}
}
