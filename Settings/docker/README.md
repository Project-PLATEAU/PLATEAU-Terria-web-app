
Windows 以下の操作を完了してください。
1. コマンドプロンプトでwsl --updateを実行してください。
2. 設定-アプリと機能-プログラムと機能-Windowsの機能の有効化または無効化-Hyper-VにチェックしてOKをクリック・再起動してください。
3. Docker Desktopをインストールし起動してください。
4. コマンドプロンプトで「docker pull ubuntu:22.04」を実行するか
    Docker Desktopでubuntu:22.04のイメージを検索しpullしてください。
5. 以下のファイルとディレクトリを本ディレクトリに準備してください。
	・Dockerfile
	・docker-compose.yaml
	・mods_proxy_settings.txt
	・startup.sh
	・webappsディレクトリ（配下にgeoserver.warが存在）
6. コマンドプロンプトにて
	docker build -t badhbh:1.5 .
   を実行してください。ビルドには時間がかかります。
7. コマンドプロンプトにてテナを
	docker compose up
   を実行し、コンテナを立ち上げてください。

http://localhost:8080
http://localhost:8080/plateau/
http://localhost:8080/geoserver/
以上のページを開けたらセットアップ作業は完了です。geoserverの立ち上げには時間がかかります。
