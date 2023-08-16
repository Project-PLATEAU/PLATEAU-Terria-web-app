package view3d.service;

import java.util.List;

import javax.persistence.EntityManagerFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import view3d.dao.NodeDao;
import view3d.dao.RouteSearchDao;
import view3d.entity.Node;
import view3d.entity.RouteSearch;
import view3d.form.RouteSearchResultForm;

@Service
public class RouteSearchService {

	/** LOGGER */
	private static final Logger LOGGER = LoggerFactory.getLogger(RouteSearchService.class);

	/** 最近ノード探索数上限 */
	private static int NODE_SEARCH_LIMIT = 5;

	/** 最近ノード距離上限 */
	private static Double NODE_DISTAMCE_LIMIT = 150.0;

	/** 経路探索距離で最短経路より長くても許容する距離倍率 */
	private static Double ALLOW_DISTANCE_MAGNIFICATION = 1.2;

	/** 画面表示座標系 */
	@Value("${route.epsg.view}")
	private Integer viewEPSG;
	/** データ座標系 */
	@Value("${route.epsg.data}")
	private Integer dataEPSG;

	/** Entityマネージャファクトリ */
	@Autowired
	protected EntityManagerFactory emf;

	/**
	 * 経路探索を実行する.
	 * 
	 * @param startLongitude 開始経度
	 * @param startLatitude  開始緯度
	 * @param endLongitude   終了経度
	 * @param endLatitude    終了緯度
	 * @param condition      条件
	 * @return
	 */
	public RouteSearchResultForm routeSearch(Double startLongitude, Double startLatitude, Double endLongitude,
			Double endLatitude, Integer condition) {
		RouteSearchResultForm routeSearchResultForm = new RouteSearchResultForm();
		NodeDao nodeDao = new NodeDao(emf);
		RouteSearchDao routeSearchDao = new RouteSearchDao(emf);
		// 開始ノードIDリストを取得
		final String startWKT = "POINT(" + startLongitude + " " + startLatitude + ")";
		final List<Node> startNodeList = nodeDao.getNearNode(startWKT, NODE_SEARCH_LIMIT, viewEPSG, dataEPSG);
		// 終了ノードIDリストを取得
		final String endWKT = "POINT(" + endLongitude + " " + endLatitude + ")";
		final List<Node> endNodeList = nodeDao.getNearNode(endWKT, NODE_SEARCH_LIMIT, viewEPSG, dataEPSG);

		if (startNodeList.size() > 0 && endNodeList.size() > 0) {
			for (int i = 0; i < NODE_SEARCH_LIMIT; i++) {
				for (int j = 0; j < 2; j++) {
					int startCounter = (startNodeList.size() >= NODE_SEARCH_LIMIT) ? i : startNodeList.size() - 1;
					int endCounter = (endNodeList.size() >= NODE_SEARCH_LIMIT) ? (i == 0) ? 0 : i + j - 1
							: endNodeList.size() - 1;
					LOGGER.debug((startCounter + 1) + "番目に近い開始ノード, " + (endCounter + 1) + "番目に近い終了ノードで検索を実行");
					final int startNodeId = startNodeList.get(startCounter).getNodeId();
					final int endNodeId = endNodeList.get(endCounter).getNodeId();
					// 距離閾値チェック
					if (startNodeList.get(startCounter).getDistance() > NODE_DISTAMCE_LIMIT
							|| endNodeList.get(endCounter).getDistance() > NODE_DISTAMCE_LIMIT) {
						LOGGER.debug("開始・終了ノードがリクエスト地点から" + NODE_DISTAMCE_LIMIT + "m以内に存在しない");
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
					}
					LOGGER.debug("開始ノードID=" + startNodeId + ", 終了ノードID=" + endNodeId);
					//final List<RouteSearch> routeSearchResult = routeSearchDao.searchRoute(startNodeId, endNodeId,
					//		condition, viewEPSG);
					final List<RouteSearch> routeSearchResult = routeSearchDao.searchRouteWithCost(startNodeId, endNodeId,
							condition, viewEPSG);
					if (routeSearchResult.size() > 0 && routeSearchResult.get(0).getGeojson() != null) {
						// 結果が見つかり次第クライアントに返却
						if (routeSearchResult.size() == 1) {
							// 件数1件の場合、そのまま返却
							routeSearchResultForm.setResult(routeSearchResult.get(0).getGeojson());
							routeSearchResultForm.setDistance(routeSearchResult.get(0).getDistance());
							routeSearchResultForm.setResultPriority(routeSearchResult.get(0).getPriority());
							LOGGER.debug("検索結果をControllerに返却");
							return routeSearchResultForm;
						}
					}
				}
			}
			// 開始・終了のノードを距離が近い順に複数回試行して得られなかった場合
			LOGGER.debug("経路探索結果が得られませんでした。");
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		} else {
			LOGGER.debug("ノード取得数不正");
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
	}
}
