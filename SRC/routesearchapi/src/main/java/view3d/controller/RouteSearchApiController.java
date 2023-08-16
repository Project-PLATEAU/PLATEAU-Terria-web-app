package view3d.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import view3d.entity.ResponseError;
import view3d.form.RouteSearchResultForm;
import view3d.service.RouteSearchService;

@RestController
@RequestMapping("/route")
public class RouteSearchApiController {
	private static final Logger LOGGER = LoggerFactory.getLogger(RouteSearchApiController.class);

	@Autowired
	RouteSearchService routeSearchService;

	@RequestMapping(value = "/search", method = RequestMethod.GET)
	@ApiOperation(value = "条件付き経路探索を実施します", notes = "条件付き経路探索を実施")
	@ResponseBody
	@ApiResponses(value = {
			@ApiResponse(code = 400, message = "リクエストパラメータが不正の場合.または開始・終了ノードがリクエスト地点から一定範囲内に存在しない場合.", response = ResponseError.class),
			@ApiResponse(code = 404, message = "経路が見つからなかった場合", response = ResponseError.class),
			@ApiResponse(code = 500, message = "処理時にエラーが発生した場合", response = ResponseError.class) })
	public RouteSearchResultForm routeSearch(@RequestParam("start") String start, @RequestParam("end") String end, @RequestParam("condition") Integer condition) {
		LOGGER.debug("経路探索API 開始");
		Double startLongitude;
		Double startLatitude; 
		Double endLongitude;
		Double endLatitude;
		try {
			startLongitude = Double.parseDouble(start.split(",")[0]);
			startLatitude = Double.parseDouble(start.split(",")[1]);
			endLongitude = Double.parseDouble(end.split(",")[0]);
			endLatitude = Double.parseDouble(end.split(",")[1]);
		} catch(Exception e) {
			LOGGER.debug("緯度経度リクエストパラメータフォーマット不正");
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		
		// 範囲チェック
		if (startLongitude < -180.0 || startLongitude > 180.0 || endLongitude < -180.0 || endLongitude > 180.0
				|| startLatitude < -90.0 || startLatitude > 90.0 || endLatitude < -90.0 || endLatitude > 90.0) {
			LOGGER.debug("緯度経度範囲不正");
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		// 条件チェック
		if (!condition.equals(1) && !condition.equals(2) && !condition.equals(3) && !condition.equals(4)) {
			LOGGER.debug("条件リクエスト不正");
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		// 経路探索を実行
		final RouteSearchResultForm routeSearchResult = routeSearchService.routeSearch(startLongitude, startLatitude,
				endLongitude, endLatitude, condition);
		LOGGER.debug("経路探索API 終了");
		return routeSearchResult;
	}
}
