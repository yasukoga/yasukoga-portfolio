const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// パス設定
const ARTICLES_DIR = path.join(__dirname, 'resource', 'blog', 'articles');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = path.join(__dirname, 'blog');

// テンプレート読み込み
const blogListTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'blog-list.html'),
  'utf-8'
);
const blogPostTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'blog-post.html'),
  'utf-8'
);

// 日付フォーマット関数
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

// 記事IDをファイル名から生成
function getArticleId(filename) {
  return filename.replace('.md', '');
}

// ブログ記事を処理
async function processArticles() {
  console.log('📝 ブログ記事の処理を開始します...');

  // 出力ディレクトリをクリーンアップ
  await fs.emptyDir(OUTPUT_DIR);

  // Markdownファイルを取得
  const files = await fs.readdir(ARTICLES_DIR);
  const mdFiles = files.filter(file => file.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('⚠️  Markdownファイルが見つかりませんでした');
    return;
  }

  const articles = [];

  // 各記事を処理
  for (const file of mdFiles) {
    const filePath = path.join(ARTICLES_DIR, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Front Matterとコンテンツを分離
    const { data, content } = matter(fileContent);

    // 必須フィールドのチェック
    if (!data.title || !data.date) {
      console.log(`⚠️  ${file}: titleまたはdateが不足しています。スキップします。`);
      continue;
    }

    const articleId = getArticleId(file);

    // MarkdownをHTMLに変換
    const htmlContent = marked(content);

    // タグのHTML生成
    const tagsHtml = data.tags
      ? data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
      : '';

    // 記事ページのHTML生成
    const postHtml = blogPostTemplate
      .replace(/{{TITLE}}/g, data.title)
      .replace(/{{DESCRIPTION}}/g, data.description || data.title)
      .replace(/{{DATE}}/g, data.date)
      .replace(/{{DATE_FORMATTED}}/g, formatDate(data.date))
      .replace(/{{TAGS}}/g, tagsHtml)
      .replace(/{{CONTENT}}/g, htmlContent);

    // 記事ページを出力
    const postDir = path.join(OUTPUT_DIR, articleId);
    await fs.ensureDir(postDir);
    await fs.writeFile(path.join(postDir, 'index.html'), postHtml);

    console.log(`✅ ${articleId} を生成しました`);

    // 一覧用のデータを保存
    articles.push({
      id: articleId,
      title: data.title,
      date: data.date,
      description: data.description || '',
      tags: data.tags || []
    });
  }

  // 日付でソート（新しい順）
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // ブログ一覧のHTML生成
  const articlesHtml = articles.map(article => `
    <article class="blog-card">
      <a href="${article.id}/index.html">
        <h3 class="blog-card-title">${article.title}</h3>
        <p class="blog-card-date">${formatDate(article.date)}</p>
        <p class="blog-card-description">${article.description}</p>
        <div class="blog-card-tags">
          ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </a>
    </article>
  `).join('');

  const listHtml = blogListTemplate.replace('{{ARTICLES}}', articlesHtml);

  // ブログ一覧ページを出力
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), listHtml);

  console.log(`✅ ブログ一覧ページを生成しました`);
  console.log(`\n🎉 完了: ${articles.length}件の記事を処理しました`);
}

// 実行
processArticles().catch(err => {
  console.error('❌ エラーが発生しました:', err);
  process.exit(1);
});
