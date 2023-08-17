"use strict";

import Terria from "../Models/Terria";

// 戻り値をlib/Models/BaseMaps/defaultBaseMaps.ts のフォーマットに合わせている
export default function createGlobalBaseMapOptions(
  terria: Terria,
  bingMapsKey: any,
  assetId: any
): any[] {
  const baseMaps = [
    {
      item: {
        type: "composite",
        id: "/basemap//全国最新写真 (シームレス)",
        name: "全国最新写真 (シームレス)",
        members: [
          {
            type: "cesium-terrain",
            id: "/basemap//全国最新写真 (シームレス)/terrain",
            name: "tokyo-23ku-terrain",
            ionAccessToken:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NGI5ZDM0Mi1jZDIzLTRmMzEtOTkwYi0zZTk4Yzk3ODZlNzQiLCJpZCI6NDA2NDYsImlhdCI6MTYwODk4MzAwOH0.3rco62ErML11TMSEflsMqeUTCDbIH6o4n4l5sssuedE",
            ionAssetId: assetId,
            attribution:
              "地形データ：基盤地図情報数値標高モデルから作成（測量法に基づく国土地理院長承認（使用）R 3JHs 259）"
          },
          {
            type: "open-street-map",
            opacity: 1,
            id: "/basemap//航空写真/imagery",
            name: "航空写真",
            url:
              "https://gic-plateau.s3.ap-northeast-1.amazonaws.com/2020/ortho/tiles/",
            fileExtension: "png",
            attribution: "東京23区の地形と空中写真"
          },
          {
            type: "open-street-map",
            opacity: 1,
            id: "/basemap//全国最新写真 (シームレス)/imagery",
            name: "全国最新写真 (シームレス)",
            url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/",
            fileExtension: "jpg",
            attribution:
              "地理院タイル (<a href='https://www.gsi.go.jp/' target='_blank' rel='noopener noreferrer'>国土地理院</a>) / Shoreline data is derived from: United States. National Imagery and Mapping Agency. \"Vector Map Level 0 (VMAP0).\" Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997."
          }
        ]
      },
      image: "./images/bgmap_tokyo.png"
    },
    {
      item: {
        type: "composite",
        id: "/basemap//空中写真 (Bing)",
        name: "空中写真 (Bing)",
        members: [
          {
            type: "cesium-terrain",
            id: "/basemap//全国最新写真 (シームレス)/terrain",
            name: "tokyo-23ku-terrain",
            ionAccessToken:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NGI5ZDM0Mi1jZDIzLTRmMzEtOTkwYi0zZTk4Yzk3ODZlNzQiLCJpZCI6NDA2NDYsImlhdCI6MTYwODk4MzAwOH0.3rco62ErML11TMSEflsMqeUTCDbIH6o4n4l5sssuedE",
            ionAssetId: assetId,
            attribution:
              "地形データ：基盤地図情報数値標高モデルから作成（測量法に基づく国土地理院長承認（使用）R 3JHs 259）"
          },
          {
            id: "/basemap//空中写真 (Bing)/imagery",
            name: "空中写真 (Bing)",
            type: "ion-imagery",
            ionAssetId: 3,
            opacity: 1
          }
        ]
      },
      image: "./images/bgmap_bing.png"
    },
    {
      item: {
        type: "composite",
        id: "/basemap//地理院地図 (淡色)",
        name: "地理院地図 (淡色)",
        members: [
          {
            type: "cesium-terrain",
            id: "/basemap//全国最新写真 (シームレス)/terrain",
            name: "tokyo-23ku-terrain",
            ionAccessToken:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NGI5ZDM0Mi1jZDIzLTRmMzEtOTkwYi0zZTk4Yzk3ODZlNzQiLCJpZCI6NDA2NDYsImlhdCI6MTYwODk4MzAwOH0.3rco62ErML11TMSEflsMqeUTCDbIH6o4n4l5sssuedE",
            ionAssetId: assetId,
            attribution:
              "地形データ：基盤地図情報数値標高モデルから作成（測量法に基づく国土地理院長承認（使用）R 3JHs 259）"
          },
          {
            type: "open-street-map",
            id: "/basemap//地理院地図 (淡色)/imagery",
            name: "地理院地図 (淡色)",
            url: "https://cyberjapandata.gsi.go.jp/xyz/pale/",
            fileExtension: "png",
            attribution:
              "地理院タイル (<a href='https://www.gsi.go.jp/' target='_blank' rel='noopener noreferrer'>国土地理院</a>) / Shoreline data is derived from: United States. National Imagery and Mapping Agency. \"Vector Map Level 0 (VMAP0).\" Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997."
          }
        ]
      },
      image: "./images/bgmap_gsi.png"
    },
    {
      item: {
        type: "composite",
        id: "/basemap//Dark Matter",
        name: "Dark Matter",
        members: [
          {
            type: "cesium-terrain",
            id: "/basemap//全国最新写真 (シームレス)/terrain",
            name: "tokyo-23ku-terrain",
            ionAccessToken:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NGI5ZDM0Mi1jZDIzLTRmMzEtOTkwYi0zZTk4Yzk3ODZlNzQiLCJpZCI6NDA2NDYsImlhdCI6MTYwODk4MzAwOH0.3rco62ErML11TMSEflsMqeUTCDbIH6o4n4l5sssuedE",
            ionAssetId: assetId,
            attribution:
              "地形データ：基盤地図情報数値標高モデルから作成（測量法に基づく国土地理院長承認（使用）R 3JHs 259）"
          },
          {
            type: "open-street-map",
            id: "/basemap//basemap-darkmatter/imagery",
            name: "Dark Matter",
            url: "https://basemaps.cartocdn.com/dark_all/",
            fileExtension: "png",
            attribution:
              "© <a href'https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>"
          }
        ]
      },
      image: "./images/bgmap_darkmatter.png"
    }
  ];

  return baseMaps;
}
