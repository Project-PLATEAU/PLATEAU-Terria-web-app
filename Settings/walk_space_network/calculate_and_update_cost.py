import psycopg2
from psycopg2.extras import DictCursor
import os

# リンクデータを取得する
def getLinkData():
    res = []
    try:
        host = os.environ['RDS_HOST']
        port = os.environ['RDS_PORT']
        dbname = os.environ['RDS_DBNAME']
        user = os.environ['RDS_USER']
        password = os.environ['RDS_PASSWORD']
        query = os.environ['GET_QUERY']
        with psycopg2.connect(
			host=host,
			port=port,
			dbname=dbname,
			user=user,
			password=password
		) as conn:
            with conn.cursor(cursor_factory=DictCursor) as cursor:
                cursor.execute(query)
                rows = cursor.fetchall()
                for aRow in rows:
                    res.append(dict(aRow))
    except Exception as e:
        print(e)
    return res
#
# コスト値を更新
def updateCost(link_id, wheelchair_cost, elderly_cost, brail_cost):
    try:
        host = os.environ['RDS_HOST']
        port = os.environ['RDS_PORT']
        dbname = os.environ['RDS_DBNAME']
        user = os.environ['RDS_USER']
        password = os.environ['RDS_PASSWORD']
        query = os.environ["UPDATE_QUERY"]
        with psycopg2.connect(
			host=host,
			port=port,
			dbname=dbname,
			user=user,
			password=password
		) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (wheelchair_cost, elderly_cost, brail_cost, link_id))
                conn.commit()
                print("更新完了.リンクID=%s" % link_id)
    except Exception as e:
        print(e)
        print("更新失敗.リンクID=%s" % link_id)

# 車いすのコストを計算する
def calculateWheelChairCosts(data):
    try:
        distance = float(data["distance"])
        # 経路構造
        coefficient_route_struct = 1.0
        if data["rt_struct"] == 1:
            coefficient_route_struct = 0.95
        # 経路種別 
        coefficient_route_type = 1.0
        if data["route_type"] == 4:
            # エレベーター
            coefficient_route_type = 0.8
        elif data["route_type"] == 7:
            # スロープ 
            #距離が長くなることが想定されるので、係数を低く設定
            coefficient_route_type = 0.8
        # 幅員
        coefficient_width = 1.0
        if data["width"] == 4:
            coefficient_width = 0.85
        elif data["width"] == 3:
            coefficient_width = 0.9
        elif data["width"] == 2:
            coefficient_width = 0.95
        # 縦断勾配
        coefficient_vtcl_slope = 1.0
        if data["vtcl_slope"] == 1:
            coefficient_vtcl_slope = 0.95
        # 段差
        coefficient_lev_diff = 1.0
        if data["lev_diff"] == 1:
            coefficient_lev_diff = 0.95
        # 歩行者用信号機
        coefficient_tfc_signal = 1.0
        if data["tfc_signal"] == 2:
            coefficient_tfc_signal = 0.95
        # エレベータ
        coefficient_elevator = 1.0
        if data["elevator"] == 5:
            # エレベータは距離が短いので係数を重く設定
            coefficient_elevator = 0.5
        cost = distance * coefficient_route_type * coefficient_width * coefficient_route_struct * coefficient_vtcl_slope * coefficient_lev_diff * coefficient_tfc_signal * coefficient_elevator
        return cost
    except Exception as e:
        print(e)
# 高齢者のコストを計算する
def calculate_elderly_cost(data):
    try:
        distance = float(data["distance"])
        # 経路構造
        coefficient_route_struct = 1.0
        if data["rt_struct"] == 1:
            coefficient_route_struct = 0.95
        # 経路種別 
        coefficient_route_type = 1.0
        if data["route_type"] == 4:
            # エレベーター
            coefficient_route_type = 0.8
        elif data["route_type"] == 7:
            # スロープ 
            #優先度はエレベーターより高いが、距離が長くなることが想定されるので、係数を低く設定
            coefficient_route_type = 0.8
        elif data["route_type"] == 6:
            # 階段
            # 回避するため、係数を高く設定
            coefficient_route_type = 1.2
        # 幅員
        coefficient_width = 1.0
        if data["width"] == 4:
            coefficient_width = 0.85
        elif data["width"] == 3:
            coefficient_width = 0.9
        elif data["width"] == 2:
            coefficient_width = 0.95
        # 縦断勾配
        coefficient_vtcl_slope = 1.0
        if data["vtcl_slope"] == 1:
            coefficient_vtcl_slope = 0.95
        # 段差
        coefficient_lev_diff = 1.0
        if data["lev_diff"] == 1:
            coefficient_lev_diff = 0.95
        # 歩行者用信号機
        coefficient_tfc_signal = 1.0
        if data["tfc_signal"] == 2:
            coefficient_tfc_signal = 0.95
        # エレベータ
        coefficient_elevator = 1.0
        if data["elevator"] == 5:
            # エレベータは距離が短いので係数を重く設定
            coefficient_elevator = 0.5
        cost = distance * coefficient_route_type * coefficient_width * coefficient_route_struct * coefficient_vtcl_slope * coefficient_lev_diff * coefficient_tfc_signal * coefficient_elevator
        return cost
    except Exception as e:
        print(e)
# 視覚障碍者のコストを計算する
def calculate_brail_cost(data):
    try:
        distance = float(data["distance"])
        # 経路構造
        coefficient_route_struct = 1.0
        if data["rt_struct"] == 1:
            coefficient_route_struct = 0.95
        # 経路種別 
        coefficient_route_type = 1.0
        if data["route_type"] == 4:
            # エレベーター
            coefficient_route_type = 0.8
        elif data["route_type"] == 6:
            # 階段
            # 回避するため、係数を高く設定
            coefficient_route_type = 1.2
        # 点字ブロック有無
        coefficient_brail_tile = 1.0
        if data["brail_tile"] == 1:
            # 点字ブロックのないルートは回避するため、係数を高く設定
            coefficient_brail_tile = 1.2
        # 幅員
        coefficient_width = 1.0
        if data["width"] == 4:
            coefficient_width = 0.85
        elif data["width"] == 3:
            coefficient_width = 0.9
        elif data["width"] == 2:
            coefficient_width = 0.95
        # 縦断勾配
        coefficient_vtcl_slope = 1.0
        if data["vtcl_slope"] == 1:
            coefficient_vtcl_slope = 0.95
        # 段差
        coefficient_lev_diff = 1.0
        if data["lev_diff"] == 1:
            coefficient_lev_diff = 0.95
        # 歩行者用信号機
        coefficient_tfc_signal = 1.0
        if data["tfc_signal"] == 2:
            coefficient_tfc_signal = 0.95
        # 歩行者用信号機種別
        coefficient_tfc_signal_type = 1.0
        if data["tfc_signal"] == 2:
            coefficient_tfc_signal_type = 0.8
        if data["tfc_signal"] == 3:
            coefficient_tfc_signal_type = 0.9
        # エレベータ
        coefficient_elevator = 1.0
        if data["elevator"] == 5:
            # エレベータは距離が短いので係数を重く設定
            coefficient_elevator = 0.5
        cost = distance * coefficient_route_type * coefficient_brail_tile * coefficient_width * coefficient_route_struct* coefficient_vtcl_slope * coefficient_lev_diff * coefficient_tfc_signal * coefficient_elevator * coefficient_tfc_signal_type
        return cost
    except Exception as e:
        print(e)
def main():
    try:
        # リンクデータを取得
        linkData = getLinkData()
        #print(linkData[0])
        for aData in linkData:
            # 車いすコスト
            wheel_chair_cost = calculateWheelChairCosts(aData)
            # 高齢者コスト
            elderly_cost = calculate_elderly_cost(aData)
            # 視覚障碍者コスト
            brail_cost = calculate_brail_cost(aData)
            print("distance=%s wheel_chair_cost=%s elderly_cost=%s brail_cost=%s" % (aData["distance"], wheel_chair_cost, elderly_cost, brail_cost))
            # コスト値を登録
            updateCost(aData["link_id"], wheel_chair_cost, elderly_cost, brail_cost)
    except Exception as e:
        print(e)

if __name__ == '__main__':
    os.environ['RDS_HOST'] = 'localhost'
    os.environ['RDS_PORT'] = '5432'
    os.environ['RDS_DBNAME'] = 'devps_db'
    os.environ['RDS_USER'] = 'devps'
    os.environ['RDS_PASSWORD'] = 'handsonp2023'
    # データ取得クエリ
    os.environ['GET_QUERY'] = "SELECT link_id, distance, rt_struct, route_type, width, vtcl_slope, lev_diff, tfc_signal, tfc_s_type, brail_tile, elevator FROM link_3d ORDER BY link_id"
    # データ更新クエリ
    os.environ["UPDATE_QUERY"] = "UPDATE link_3d SET cost_wheelchair=%s, cost_elderly=%s, cost_brail=%s WHERE link_id=%s"
    main()