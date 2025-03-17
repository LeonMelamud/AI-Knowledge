# AEO Implementation Guide

## Adding Schema Markup to News Articles

For each news topic in the YAML file, implement the following schema markup patterns in the HTML:

### Article Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "אנתרופיק משיקה את קלוד 3.7: מודל בינה מלאכותית חדש פורץ דרך",
  "datePublished": "2024-12-01T08:00:00+03:00",
  "dateModified": "2024-12-01T08:00:00+03:00",
  "author": {
    "@type": "Organization",
    "name": "AI Knowledge Base"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AI Knowledge Base",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "description": "אנתרופיק השיקה את קלוד 3.7, מודל הבינה המלאכותית המתקדם ביותר שלהם עד כה, שקובע סטנדרטים חדשים בהיסק, קידוד ומשימות מולטימודליות.",
  "image": "https://example.com/images/claude-3-7-launch.jpg",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/news/claude-3-7-launch"
  }
}
</script>
```

### FAQ Schema

For the questions and answers in each topic:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "מהו קלוד 3.7?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "קלוד 3.7 הוא מודל הבינה המלאכותית המתקדם ביותר של אנתרופיק, שקובע סטנדרטים חדשים בהיסק, קידוד ומשימות מולטימודליות."
      }
    },
    {
      "@type": "Question",
      "name": "מהן התכונות העיקריות של קלוד 3.7?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "התכונות העיקריות כוללות ביצועים מעולים במדדי היסק, יכולות קידוד משופרות, הבנה מולטימודלית מתקדמת, חלון הקשר של 200K טוקנים, שיעורי הזיה מופחתים ודיוק עובדתי משופר."
      }
    }
  ]
}
</script>
```

## HTML Structure Guidelines for AEO

When rendering the YAML content to HTML, follow these guidelines:

1. **Direct Answer Formatting**
   - Place the primary answer to each question in a `<p class="direct-answer">` element
   - Limit these direct answers to 40-60 words
   - Position them immediately after the question heading

2. **Heading Structure**
   - Use `<h1>` for the page title
   - Use `<h2>` for section titles (e.g., "קלוד 3.7")
   - Use `<h3>` for topic titles
   - Use `<h4>` for questions

3. **Lists and Tables**
   - Convert bullet points in descriptions to proper HTML lists
   - Use tables for comparing features across models

Example:

```html
<section>
  <h2 id="claude-3-7">קלוד 3.7</h2>
  
  <article>
    <h3>אנתרופיק משיקה את קלוד 3.7: מודל בינה מלאכותית חדש פורץ דרך</h3>
    
    <h4>מהו קלוד 3.7?</h4>
    <p class="direct-answer">קלוד 3.7 הוא מודל הבינה המלאכותית המתקדם ביותר של אנתרופיק, שקובע סטנדרטים חדשים בהיסק, קידוד ומשימות מולטימודליות.</p>
    
    <h4>מהן התכונות העיקריות של קלוד 3.7?</h4>
    <p class="direct-answer">התכונות העיקריות כוללות ביצועים מעולים במדדי היסק, יכולות קידוד משופרות, הבנה מולטימודלית מתקדמת, חלון הקשר של 200K טוקנים, שיעורי הזיה מופחתים ודיוק עובדתי משופר.</p>
    
    <div class="full-description">
      <p>אנתרופיק השיקה את קלוד 3.7, מודל הבינה המלאכותית המתקדם ביותר שלהם עד כה, שקובע סטנדרטים חדשים בהיסק, קידוד ומשימות מולטימודליות. המודל החדש עולה באופן משמעותי על גרסאות קודמות ומתחרים בתחומים מרכזיים.</p>
      
      <h5>תכונות מרכזיות:</h5>
      <ul>
        <li>ביצועים מעולים במדדי היסק מורכבים</li>
        <li>יכולות קידוד משופרות עם ניפוי באגים ואופטימיזציה טובים יותר</li>
        <li>הבנה מולטימודלית מתקדמת עם ניתוח תמונה משופר</li>
        <li>חלון הקשר של 200K טוקנים, כפול מהמודלים הקודמים</li>
        <li>שיעורי הזיה מופחתים ודיוק עובדתי משופר</li>
        <li>מבנה מחירים חדש ל-API עם תעריפים תחרותיים</li>
      </ul>
    </div>
  </article>
</section>
```

## Technical Optimizations for AEO

1. **Page Speed**
   - Optimize images (use WebP format)
   - Implement lazy loading for images
   - Minimize CSS and JavaScript
   - Use appropriate caching headers

2. **Mobile Optimization**
   - Ensure responsive design for all screen sizes
   - Implement AMP (Accelerated Mobile Pages) versions of key content
   - Test voice interaction flows on mobile devices

3. **Semantic HTML**
   - Use appropriate semantic HTML5 elements (`<article>`, `<section>`, `<nav>`, etc.)
   - Include proper ARIA attributes for accessibility
   - Ensure proper heading hierarchy

4. **URL Structure**
   - Create clean, descriptive URLs for each topic
   - Include key questions in URL paths when appropriate
   - Implement hreflang tags for multilingual content

## Monitoring AEO Performance

Track these metrics to evaluate your AEO implementation:

1. Featured snippet appearances
2. Voice search appearances
3. Click-through rates from AI assistant referrals
4. Average time spent on page for AI-referred traffic
5. Direct answer impressions in search console

Regularly update content based on performance data and emerging questions. 