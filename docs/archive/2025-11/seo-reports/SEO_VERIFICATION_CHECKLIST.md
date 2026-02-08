# SEO/AEO Implementation Checklist

## Quick Verification Steps

### 1. Visual Inspection (Browser)

**Hot News Page** - `http://localhost:5173/hot-news`
- [ ] View page source (Ctrl/Cmd + U)
- [ ] Check `<title>` contains "חדשות חמות | AI Knowledge"
- [ ] Check `<meta name="description">` exists
- [ ] Check `<meta property="og:title">` exists
- [ ] Check `<script type="application/ld+json">` exists
- [ ] Verify multiple schema objects in JSON-LD

**Switch to English** - `http://localhost:5173/hot-news?lang=en`
- [ ] Title changes to "Hot AI News | AI Knowledge"
- [ ] Description changes to English
- [ ] All meta tags update

**Other Pages to Check**:
- [ ] `/concepts` - Has breadcrumbs and schema
- [ ] `/tools` - Has breadcrumbs and schema  
- [ ] `/models` - Has breadcrumbs and schema

### 2. Static Files

**Sitemap** - `http://localhost:8085/sitemap.xml`
- [ ] Returns valid XML
- [ ] Contains all static pages
- [ ] Includes news articles (dynamic)
- [ ] Has proper priorities and changefreq

**llms.txt** - `http://localhost:5173/llms.txt`
- [ ] Plain text format
- [ ] Contains site overview
- [ ] Lists API endpoints
- [ ] Has AI agent instructions

**robots.txt** - `http://localhost:5173/robots.txt`
- [ ] Exists and accessible
- [ ] Points to sitemap.xml

### 3. OpenGraph Images

**Default Image** - `http://localhost:5173/og-image.svg`
- [ ] Loads successfully
- [ ] Shows "AI Knowledge Hub" branding
- [ ] 1200x630 dimensions

**Logo** - `http://localhost:5173/logo.svg`
- [ ] Loads successfully
- [ ] Shows AI network icon
- [ ] 200x200 dimensions

### 4. Schema Validation

**Tools**:
1. Open [Schema.org Validator](https://validator.schema.org/)
2. Paste `http://localhost:5173/hot-news` URL
3. Check for errors

**Expected Schema Types on HotNews**:
- [ ] Organization
- [ ] BreadcrumbList  
- [ ] CollectionPage
- [ ] ItemList (with NewsArticle items)

### 5. Social Media Preview

**Facebook Debug Tool**:
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Enter: `http://localhost:5173/hot-news`
3. Click "Debug"

**Expected**:
- [ ] Title shows correctly
- [ ] Description shows correctly
- [ ] Image shows (og-image.svg)

**Twitter Card Validator**:
1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter URL
3. Preview card

### 6. Browser DevTools Checks

**React DevTools**:
1. Open React DevTools
2. Find `SEO` component in tree
3. Check props:
   - [ ] `title` prop exists
   - [ ] `description` prop exists
   - [ ] `breadcrumbs` array exists
   - [ ] `schema` object exists

**Elements Tab**:
1. Inspect `<head>` element
2. Count meta tags (should be 15+)
3. Find JSON-LD script
4. Verify it's valid JSON

### 7. E2E Test Run

```bash
cd client
npx playwright test e2e/seo.spec.js
```

**Expected**:
- [ ] All 4 tests pass (or most pass)
- [ ] No critical errors
- [ ] Screenshots look correct

### 8. Performance Check

**Lighthouse** (Chrome DevTools):
1. Open DevTools
2. Go to Lighthouse tab
3. Run audit (Desktop)

**Check**:
- [ ] SEO score > 90
- [ ] Accessibility > 90
- [ ] Performance > 80

### 9. Mobile Testing

**Responsive Design**:
1. Open DevTools
2. Toggle device toolbar (Ctrl/Cmd + Shift + M)
3. Test on iPhone 12

**Check**:
- [ ] Page loads correctly
- [ ] Meta tags present
- [ ] Viewport meta tag set
- [ ] Touch targets adequate

### 10. Language Switching

**Hebrew (Default)**:
- [ ] `http://localhost:5173/hot-news`
- [ ] Title in Hebrew
- [ ] RTL layout active
- [ ] `lang="he"` in HTML tag

**English**:
- [ ] `http://localhost:5173/hot-news?lang=en`
- [ ] Title in English
- [ ] LTR layout active
- [ ] `lang="en"` in HTML tag

## Advanced Checks (Optional)

### Rich Results Test
1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter URL or paste HTML
3. Check for eligible rich results

### Structured Data Linter
1. Go to [Structured Data Linter](http://linter.structured-data.org/)
2. Paste page HTML
3. Verify all schemas parse correctly

### PageSpeed Insights
1. Go to [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter URL (once deployed)
3. Check Core Web Vitals

## Quick Test Script

```bash
# Test sitemap
curl http://localhost:8085/sitemap.xml

# Test llms.txt
curl http://localhost:5173/llms.txt

# Test robots.txt
curl http://localhost:5173/robots.txt

# Test OG image
curl -I http://localhost:5173/og-image.svg

# Test logo
curl -I http://localhost:5173/logo.svg
```

## Issues to Watch For

### Common Problems:
- [ ] Port mismatch (5173 vs 5174)
- [ ] Missing meta tags in production build
- [ ] CORS issues with images
- [ ] Schema validation errors
- [ ] Broken internal links
- [ ] Missing alt text
- [ ] Invalid JSON-LD syntax

### If Tests Fail:
1. Check server is running (port 8085)
2. Check React dev server (port 5173)
3. Clear browser cache
4. Hard refresh (Ctrl/Cmd + Shift + R)
5. Check console for errors
6. Verify data files exist

## Success Criteria

### Must Have:
- ✅ All pages have title and description
- ✅ All pages have OpenGraph tags
- ✅ JSON-LD schema on all pages
- ✅ Sitemap.xml generates correctly
- ✅ llms.txt is comprehensive
- ✅ Images load (og-image, logo)

### Nice to Have:
- ✅ Breadcrumbs on all pages
- ✅ Rich NewsArticle schema
- ✅ Multiple schema types per page
- ✅ Dynamic sitemap from data
- ✅ Language-aware meta tags

---

**Last Updated**: November 24, 2025  
**Status**: Ready for verification
