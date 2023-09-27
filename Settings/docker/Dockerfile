#--------------------------------------------#
# xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#
# text : UTF-8
#
# ver1.1.1 2023-07-05 (Node.js, npm, yarn)
# ver1.1.2 2023-07-11 (PostgreSQL, PostGIS, pgRouting)
# ver1.1.3 2023-07-12 (PLATEAU-VIEW)
#
# 以下README.mdに記載の内容
# Windows 以下の操作を完了してからイメージをビルドしてください
# 1. コマンドプロンプトでwsl --updateを実行してください
# 2. 設定-アプリと機能-プログラムと機能-Windowsの機能の有効化または無効化-Hyper-VにチェックしてOKをクリック・再起動してください
# 3. Docker Desktopをインストールし起動してください
# 4. コマンドプロンプトで「docker pull ubuntu:22.04」を実行するか
#     Docker Desktopでubuntu:22.04のイメージを検索しpullしてください
# 5. startup.shとmods_proxy_settings.txtをこのファイルと同じディレクトリに格納してください
# 
# xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#--------------------------------------------#



#--------------
# for Docker /
#-----------

FROM ubuntu:22.04


#--------------
# for ubuntu /
#-----------

SHELL ["/bin/bash", "-c"]
RUN apt update && apt upgrade -y
RUN apt update && apt install -y --no-install-recommends openssl unzip gdal-bin ca-certificates curl dnsutils gnupg gnupg2 htop iputils-ping lsb-release net-tools sqlite3 vim wget lftp git openjdk-11-jdk language-pack-ja \
		&& apt clean && rm -rf /var/cache/apt/* && rm -rf /var/lib/apt/lists/*


#------------------------------------------------------------------
# for node.js 16.16.0=>16.20.0, npm 8.11.0=>8.19.4, yarn 1.22.19 /
#---------------------------------------------------------------

ARG NODE_VERSION=16.16.0
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install -y nodejs && apt clean && rm -rf /var/lib/apt/lists/*
#RUN npm install -g n && npm cache clean --force
#RUN n ${NODE_VERSION}
RUN npm install -g yarn && npm cache clean --force


#-----------------------------------------
# for PostgreSQL14, PostGIS3, pgRouting /
#--------------------------------------

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=ja_JP.UTF-8

RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN apt install curl ca-certificates gnupg && apt clean && rm -rf /var/lib/apt/lists/*
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt update 
RUN apt install postgresql-14-postgis-3 -y
RUN apt install postgresql-14-pgrouting -y  && apt clean && rm -rf /var/lib/apt/lists/*


#----------------------------------------------------
#     for init  PostgreSQL, PostGIS, and pgRouting /
#-------------------------------------------------

USER postgres
ARG PGPASSWORD=handsonp2023
RUN service postgresql start \
 && psql -c "CREATE ROLE devps WITH SUPERUSER CREATEDB CREATEROLE INHERIT LOGIN REPLICATION BYPASSRLS ENCRYPTED PASSWORD 'handsonp2023';" \
 && psql -c "CREATE DATABASE devps_db WITH OWNER = devps;" \
 && psql -h localhost -p 5432 -U devps -d devps_db -c "CREATE EXTENSION postgis;" \
 && psql -h localhost -p 5432 -U devps -d devps_db -c "CREATE EXTENSION pgrouting;"

EXPOSE 5432
RUN echo "host all all 0.0.0.0/0 scram-sha-256" >> /etc/postgresql/14/main/pg_hba.conf
RUN echo "listen_addresses = '*'" >> /etc/postgresql/14/main/postgresql.conf

USER root


#---------------
# for PLATEAU /
#------------

WORKDIR /usr/local/work
RUN git clone https://github.com/Project-PLATEAU/PLATEAU-VIEW.git TerriaMap
WORKDIR ./TerriaMap/packages
RUN git clone https://github.com/Project-PLATEAU/terriajs.git terriajs
RUN sed -e "s/git:\/\/github.com\//https:\/\/github\.com\//g" ./terriajs/package.json > testsedtext.txt
RUN cat testsedtext.txt > ./terriajs/package.json
WORKDIR /usr/local/work/TerriaMap
ARG NODE_OPTIONS=--max_old_space_size=4096
RUN yarn && yarn gulp release && yarn cache clean

#EXPOSE 3001


#---------------
# for Tomcat9 /
#------------

ARG TOMCAT_VERSION=9.0.75
ARG CORS_ENABLED=false
ARG CORS_ALLOWED_ORIGINS=*
ARG CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,HEAD,OPTIONS
ARG CORS_ALLOWED_HEADERS=*

# Environment variables
ENV CATALINA_HOME=/opt/apache-tomcat-${TOMCAT_VERSION}
ENV EXTRA_JAVA_OPTS="-Xms512m -Xmx1024m"
ENV CORS_ENABLED=$CORS_ENABLED
ENV CORS_ALLOWED_ORIGINS=$CORS_ALLOWED_ORIGINS
ENV CORS_ALLOWED_METHODS=$CORS_ALLOWED_METHODS
ENV CORS_ALLOWED_HEADERS=$CORS_ALLOWED_HEADERS
ENV DEBIAN_FRONTEND=noninteractive

# see https://docs.geoserver.org/stable/en/user/production/container.html
ENV CATALINA_OPTS="\$EXTRA_JAVA_OPTS \
    -Djava.awt.headless=true -server \
    -Dfile.encoding=UTF-8 \
    -Djavax.servlet.request.encoding=UTF-8 \
    -Djavax.servlet.response.encoding=UTF-8 \
    -Xms512m \
    -Xmx1024m \
    -Xss1024k \
    -XX:PermSize=512m \
    -XX:MaxPermSize=1024m \
    -XX:+UseConcMarkSweepGC \
    -XX:+CMSClassUnloadingEnabled \
    -D-XX:SoftRefLRUPolicyMSPerMB=36000 \
    -Xbootclasspath/a:$CATALINA_HOME/lib/marlin.jar \
    -Dsun.java2d.renderer=sun.java2d.marlin.DMarlinRenderingEngine \
    -Dorg.geotools.coverage.jaiext.enabled=true"

WORKDIR /opt/

RUN wget -q https://archive.apache.org/dist/tomcat/tomcat-9/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz \
&& tar xf apache-tomcat-${TOMCAT_VERSION}.tar.gz \
&& rm apache-tomcat-${TOMCAT_VERSION}.tar.gz \
&& rm -rf /opt/apache-tomcat-${TOMCAT_VERSION}/webapps/ROOT \
&& rm -rf /opt/apache-tomcat-${TOMCAT_VERSION}/webapps/docs \
&& rm -rf /opt/apache-tomcat-${TOMCAT_VERSION}/webapps/examples


#---------------
# for Apache2 /
#------------

ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data
ENV APACHE_PID_FILE /var/run/apache2.pid
ENV APACHE_RUN_DIR /var/run/apache2
ENV APACHE_LOG_DIR /var/log/apache2
ENV APACHE_LOCK_DIR /var/lock/apache2

RUN apt-get update && apt-get install -y apache2

WORKDIR /etc/apache2/sites-enabled
RUN sed -e "s/#ServerName www.example.com/ServerName 172.17.0.2/g" ./000-default.conf > testsedtext.txt
RUN cat testsedtext.txt > ./000-default.conf
RUN a2enmod proxy proxy_http
COPY mods_proxy_settings.txt .
RUN cat mods_proxy_settings.txt > ./proxy.conf

EXPOSE 80



#-----------
# cleanup /
#--------


RUN apt purge -y  \
&& apt autoremove --purge -y \
&& rm -rf /tmp/*

#--------------
# for ubuntu /
#-----------


COPY *.sh /
RUN chmod +x /*.sh



ENTRYPOINT ["./startup.sh"]

WORKDIR /

