// モジュールのインポート
const express = require('express');
const axios = require('axios');

// アプリの作成
const app = express();

// テンプレートエンジンの設定
app.set('view engine', 'ejs');

// 静的ファイルの設定
app.use(express.static('public'));

// ルートパスへのアクセス時の処理
app.get('/', (req, res) => {
  // index.ejsをレンダリング
  res.render('index');
});

// /compareへのPOSTリクエスト時の処理
app.post('/compare', (req, res) => {
  // リクエストボディからチームIDを取得
  const team1 = req.body.team1;
  const team2 = req.body.team2;

  // NBAのAPIのURL
  const url = 'https://stats.nba.com/stats/leaguedashteamshotlocations';

  // NBAのAPIのパラメータ
  const params = {
    Season: '2020-21',
    SeasonType: 'Regular Season',
    LeagueID: '00',
    PerMode: 'PerGame',
    TeamID: null // ここにチームIDを入れる
  };

  // チーム1とチーム2のデータを取得する関数
  const getData = async (teamID) => {
    // パラメータにチームIDをセット
    params.TeamID = teamID;
    // NBAのAPIにリクエストを送る
    const response = await axios.get(url, { params });
    // レスポンスからデータを抽出
    const data = response.data.resultSets[0].rowSet[0];
    // データを返す
    return data;
  };

  // チーム1とチーム2のデータを並行して取得する
  Promise.all([getData(team1), getData(team2)])
    .then((results) => {
      // 結果を配列に格納
      const team1_data = results[0];
      const team2_data = results[1];

      // 表作成
      const comparison = [team1_data, team2_data];
      // 不要な列を削除
      comparison.forEach((row) => {
        row.splice(0, 1); // チームIDを削除
        row.splice(10, 6); // RAからPAINTを削除
        row.splice(14, 3); // CORNER3からBACKCOURTを削除
      });
      // 数字だけで差を計算
      const difference = comparison[0].map((value, index) => {
        return value - comparison[1][index];
      });
      // 差を追加
      comparison.push(difference);
      // 追加した行のインデックスを取得
      const index = comparison.length - 1;
      // columns[0]の値をcomparisonに変更
      comparison[index][0] = 'comparison';

      // comparison.htmlをレンダリング
      res.render('comparison', { comparison });
    })
    .catch((error) => {
      // エラーが発生した場合
      console.error(error);
      // エラーメッセージを表示
      res.send('Something went wrong');
    });
});

// サーバーの起動
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
