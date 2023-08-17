import React, { ReactNode } from "react";
import ViewState from "../../ReactViewModels/ViewState";
import i18next from "i18next";
import { Trans } from "react-i18next";

export const googleAnalyticsNotification = (viewState: ViewState): ReactNode=>{
  return (
    <div>
      <p>
        当サイトでは、サービス向上やウェブサイトの改善のためにGoogle Inc.の提供するアクセス分析のツールであるGoogle Analyticsを利用した計測を行っております。<br/>
        Google Analyticsは、当サイトが発行するCookieを利用して、個人を特定する情報を含まずにウェブサイトの利用データ（アクセス状況、トラフィック、閲覧環境など）を収集しております。<br/>
        Cookieの利用に関してはGoogleのプライバシーポリシーと規約に基づいております。<br/>
        取得したデータはウェブサイト利用状況の分析、サイト運営者へのレポートの作成、その他のサービスの提供に関わる目的に限り、これを使用します。
      </p>
      <p>
        Google Analyticsの利用規約及びプライバシーポリシーに関する説明については、Google Analyticsのサイトをご覧ください。<br/>
        <br/>
      </p>
      <ul>
        <li><a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" aria-label="Google Analytics利用規約へのリンク">Google Analytics利用規約</a></li>
        <li><a href="https://policies.google.com/privacy?hl=ja" target="_blank" aria-label="Googleのプライバシーポリシーへのリンク">Googleのプライバシーポリシー</a></li>
        <li><a href="https://marketingplatform.google.com/about/analytics/" target="_blank">Google Analyticsに関する詳細情報</a></li>
      </ul>
      <p>
        <br/>
        Google Analytics オプトアウト アドオンを利用してGoogle Analyticsのトラッキングを拒否することも可能です。<br/>
        Google Analytics オプトアウト アドオンは、JavaScriptによるデータの使用をウェブサイトのユーザーが無効にできるように開発された機能です。<br/>
        この機能を利用するには、このアドオンをダウンロードして、ご利用のブラウザにインストールしてください。<br/>
        <br/>
      </p>
      <ul>
        <li><a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" aria-label="Google Analytics オプトアウト アドオンへのリンク">Google Analytics オプトアウト アドオン</a></li>
      </ul>
    </div>
  );
  // return (
  //   <Trans i18nKey="googleAnalyticsNotification.content">
  //   <div>
  //     <p>
  //       当サイトでは、サービス向上やウェブサイトの改善のためにGoogle Inc.の提供するアクセス分析のツールであるGoogle Analyticsを利用した計測を行っております。<br/>
  //       Google Analyticsは、当サイトが発行するCookieを利用して、個人を特定する情報を含まずにウェブサイトの利用データ（アクセス状況、トラフィック、閲覧環境など）を収集しております。<br/>
  //       Cookieの利用に関してはGoogleのプライバシーポリシーと規約に基づいております。<br/>
  //       取得したデータはウェブサイト利用状況の分析、サイト運営者へのレポートの作成、その他のサービスの提供に関わる目的に限り、これを使用します。
  //     </p>
  //     <p>
  //       Google Analyticsの利用規約及びプライバシーポリシーに関する説明については、Google Analyticsのサイトをご覧ください。<br/>
  //       <br/>
  //     </p>
  //     <ul>
  //       <li><a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" aria-label="Google Analytics利用規約へのリンク">Google Analytics利用規約</a></li>
  //       <li><a href="https://policies.google.com/privacy?hl=ja" target="_blank" aria-label="Googleのプライバシーポリシーへのリンク">Googleのプライバシーポリシー</a></li>
  //       <li><a href="https://marketingplatform.google.com/about/analytics/" target="_blank">Google Analyticsに関する詳細情報</a></li>
  //     </ul>
  //     <p>
  //       <br/>
  //       Google Analytics オプトアウト アドオンを利用してGoogle Analyticsのトラッキングを拒否することも可能です。<br/>
  //       Google Analytics オプトアウト アドオンは、JavaScriptによるデータの使用をウェブサイトのユーザーが無効にできるように開発された機能です。<br/>
  //       この機能を利用するには、このアドオンをダウンロードして、ご利用のブラウザにインストールしてください。<br/>
  //       <br/>
  //     </p>
  //     <ul>
  //       <li><a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" aria-label="Google Analytics オプトアウト アドオンへのリンク">Google Analytics オプトアウト アドオン</a></li>
  //     </ul>
  //   </div>
  //   </Trans>
  // );

};