const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Analysis helper functions
function analyzeHeadline($) {
  const score = { points: 0, max: 15, findings: [], recommendations: [] };

  const h1 = $('h1').first();
  const h1Text = h1.text().trim();

  if (h1.length === 0) {
    score.findings.push('❌ No H1 headline found');
    score.recommendations.push('Add a clear, benefit-driven H1 headline above the fold');
  } else {
    score.points += 5;
    score.findings.push('✓ H1 headline present');

    // Check headline length (ideal: 6-12 words)
    const wordCount = h1Text.split(/\s+/).length;
    if (wordCount >= 4 && wordCount <= 15) {
      score.points += 3;
      score.findings.push('✓ Headline length is optimal');
    } else if (wordCount < 4) {
      score.findings.push('⚠️ Headline may be too short');
      score.recommendations.push('Consider expanding headline to communicate more value');
    } else {
      score.findings.push('⚠️ Headline may be too long');
      score.recommendations.push('Consider shortening headline for better scannability');
    }

    // Check for power words
    const powerWords = ['free', 'new', 'proven', 'guaranteed', 'instant', 'easy', 'discover', 'secret', 'exclusive', 'limited', 'save', 'results', 'fast', 'simple', 'powerful'];
    const hasPoweWord = powerWords.some(word => h1Text.toLowerCase().includes(word));
    if (hasPoweWord) {
      score.points += 4;
      score.findings.push('✓ Headline contains power words');
    } else {
      score.recommendations.push('Consider adding power words to make headline more compelling');
    }

    // Check for numbers
    if (/\d/.test(h1Text)) {
      score.points += 3;
      score.findings.push('✓ Headline contains specific numbers (builds credibility)');
    }
  }

  return score;
}

function analyzeCTA($) {
  const score = { points: 0, max: 20, findings: [], recommendations: [] };

  // Find buttons and CTA-like elements
  const buttons = $('button, a.btn, a.button, .cta, [class*="cta"], input[type="submit"], a[class*="button"]');
  const allLinks = $('a');

  // Look for action-oriented text
  const ctaPatterns = /get started|sign up|buy now|start|try|download|claim|grab|join|subscribe|register|book|schedule|learn more|get|start free|begin/i;

  let ctaElements = [];
  buttons.each((i, el) => {
    const text = $(el).text().trim();
    if (text && ctaPatterns.test(text)) {
      ctaElements.push(text);
    }
  });

  allLinks.each((i, el) => {
    const text = $(el).text().trim();
    const classes = $(el).attr('class') || '';
    if ((classes.includes('btn') || classes.includes('button') || classes.includes('cta')) && text) {
      if (!ctaElements.includes(text)) {
        ctaElements.push(text);
      }
    }
  });

  if (ctaElements.length === 0) {
    // Broader search
    $('button, input[type="submit"]').each((i, el) => {
      const text = $(el).text().trim() || $(el).attr('value') || '';
      if (text) ctaElements.push(text);
    });
  }

  if (ctaElements.length === 0) {
    score.findings.push('❌ No clear CTA buttons found');
    score.recommendations.push('Add prominent call-to-action buttons with action-oriented text');
  } else {
    score.points += 8;
    score.findings.push(`✓ Found ${ctaElements.length} CTA element(s)`);

    // Check for action-oriented language
    const hasActionWords = ctaElements.some(text =>
      /^(get|start|try|download|claim|grab|join|subscribe|register|book|schedule|buy|shop|order)/i.test(text.trim())
    );

    if (hasActionWords) {
      score.points += 6;
      score.findings.push('✓ CTAs use action-oriented language');
    } else {
      score.recommendations.push('Start CTA text with action verbs (Get, Start, Try, Claim)');
    }

    // Check for benefit-oriented CTA
    const hasBenefit = ctaElements.some(text =>
      /free|instant|now|today|save|discount/i.test(text)
    );
    if (hasBenefit) {
      score.points += 6;
      score.findings.push('✓ CTAs communicate benefits or urgency');
    } else {
      score.recommendations.push('Add benefit language to CTAs (e.g., "Start Free Trial" vs "Submit")');
    }
  }

  return score;
}

function analyzeTrustSignals($) {
  const score = { points: 0, max: 15, findings: [], recommendations: [] };

  const html = $.html().toLowerCase();
  const text = $('body').text().toLowerCase();

  // Check for testimonials
  const hasTestimonials =
    $('[class*="testimonial"], [class*="review"], [class*="quote"], blockquote').length > 0 ||
    /testimonial|"[^"]{20,}".*—|customer review/i.test(html);

  if (hasTestimonials) {
    score.points += 4;
    score.findings.push('✓ Testimonials or reviews detected');
  } else {
    score.recommendations.push('Add customer testimonials to build trust');
  }

  // Check for trust badges / logos
  const hasTrustBadges =
    $('img[src*="badge"], img[src*="trust"], img[src*="secure"], img[alt*="secure"], img[alt*="certified"]').length > 0 ||
    $('[class*="trust"], [class*="badge"], [class*="secure"]').length > 0;

  if (hasTrustBadges) {
    score.points += 3;
    score.findings.push('✓ Trust badges detected');
  } else {
    score.recommendations.push('Add trust badges (security seals, certifications, awards)');
  }

  // Check for client logos
  const hasClientLogos =
    $('[class*="logo"], [class*="client"], [class*="partner"], [class*="featured"]').find('img').length >= 3 ||
    /as seen|featured in|trusted by|used by/i.test(text);

  if (hasClientLogos) {
    score.points += 4;
    score.findings.push('✓ Client logos or "as seen in" section detected');
  } else {
    score.recommendations.push('Add client logos or "As Seen In" section for social proof');
  }

  // Check for statistics/numbers
  const hasStats = /\d+[,.]?\d*\s*(\+|%|k|m|million|thousand|customers|users|clients|downloads|reviews)/i.test(text);
  if (hasStats) {
    score.points += 4;
    score.findings.push('✓ Specific statistics/metrics found');
  } else {
    score.recommendations.push('Add specific numbers (e.g., "10,000+ customers", "99% satisfaction")');
  }

  return score;
}

function analyzeValueProposition($) {
  const score = { points: 0, max: 15, findings: [], recommendations: [] };

  const heroArea = $('header, [class*="hero"], [class*="banner"], section').first();
  const heroText = heroArea.text().toLowerCase();
  const bodyText = $('body').text().toLowerCase();

  // Check for benefit-oriented language
  const benefitWords = ['save', 'increase', 'improve', 'boost', 'reduce', 'eliminate', 'transform', 'grow', 'maximize', 'achieve', 'get', 'gain'];
  const hasBenefits = benefitWords.some(word => heroText.includes(word));

  if (hasBenefits) {
    score.points += 5;
    score.findings.push('✓ Benefit-oriented language in hero section');
  } else {
    score.recommendations.push('Lead with benefits, not features - what does the customer gain?');
  }

  // Check for unique selling proposition indicators
  const uspIndicators = ['only', 'first', 'unique', 'exclusive', 'unlike', 'different', '#1', 'best', 'leading'];
  const hasUSP = uspIndicators.some(word => heroText.includes(word));

  if (hasUSP) {
    score.points += 5;
    score.findings.push('✓ Unique selling proposition indicators found');
  } else {
    score.recommendations.push('Clarify what makes you different from competitors');
  }

  // Check for subheadline
  const h2 = $('h2').first();
  const hasSubheadline = h2.length > 0 && h2.closest('header, [class*="hero"], section').length > 0;

  if (hasSubheadline) {
    score.points += 5;
    score.findings.push('✓ Supporting subheadline present');
  } else {
    score.recommendations.push('Add a subheadline to expand on your main value proposition');
  }

  return score;
}

function analyzeForm($) {
  const score = { points: 0, max: 10, findings: [], recommendations: [] };

  const forms = $('form');

  if (forms.length === 0) {
    score.findings.push('ℹ️ No forms detected (may be intentional for some page types)');
    score.points += 5; // Neutral - not all pages need forms
    return score;
  }

  score.findings.push(`✓ ${forms.length} form(s) found`);

  // Analyze first/main form
  const mainForm = forms.first();
  const inputs = mainForm.find('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  const inputCount = inputs.length;

  if (inputCount <= 3) {
    score.points += 5;
    score.findings.push(`✓ Form has ${inputCount} fields (low friction)`);
  } else if (inputCount <= 5) {
    score.points += 3;
    score.findings.push(`⚠️ Form has ${inputCount} fields (moderate friction)`);
    score.recommendations.push('Consider reducing form fields - each field reduces conversions by ~7%');
  } else {
    score.findings.push(`❌ Form has ${inputCount} fields (high friction)`);
    score.recommendations.push('Reduce form fields to essential information only');
  }

  // Check for inline validation indicators
  const hasValidation = mainForm.find('[required], [pattern], [class*="valid"]').length > 0;
  if (hasValidation) {
    score.points += 3;
    score.findings.push('✓ Form validation detected');
  }

  // Check for field labels
  const labels = mainForm.find('label');
  if (labels.length >= inputCount * 0.5) {
    score.points += 2;
    score.findings.push('✓ Form fields have labels');
  } else {
    score.recommendations.push('Add clear labels to all form fields');
  }

  return score;
}

function analyzeMobileOptimization($) {
  const score = { points: 0, max: 10, findings: [], recommendations: [] };

  const html = $.html();

  // Check for viewport meta tag
  const hasViewport = $('meta[name="viewport"]').length > 0;
  if (hasViewport) {
    score.points += 4;
    score.findings.push('✓ Viewport meta tag present');
  } else {
    score.findings.push('❌ No viewport meta tag found');
    score.recommendations.push('Add viewport meta tag for mobile responsiveness');
  }

  // Check for responsive indicators
  const hasMediaQueries = /@media/i.test(html);
  const hasResponsiveClasses = /col-|flex|grid|responsive|mobile|sm:|md:|lg:/i.test(html);

  if (hasMediaQueries || hasResponsiveClasses) {
    score.points += 4;
    score.findings.push('✓ Responsive design patterns detected');
  } else {
    score.recommendations.push('Ensure responsive design for mobile users');
  }

  // Check for touch-friendly elements
  const hasTouchFriendly = $('button, a.btn, [class*="button"]').length > 0;
  if (hasTouchFriendly) {
    score.points += 2;
    score.findings.push('✓ Touch-friendly button elements found');
  }

  return score;
}

function analyzePageStructure($) {
  const score = { points: 0, max: 15, findings: [], recommendations: [] };

  // Check for clear visual hierarchy
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  if (h1Count === 1) {
    score.points += 4;
    score.findings.push('✓ Single H1 tag (good for SEO and clarity)');
  } else if (h1Count === 0) {
    score.findings.push('❌ No H1 tag found');
    score.recommendations.push('Add exactly one H1 tag for your main headline');
  } else {
    score.findings.push('⚠️ Multiple H1 tags found');
    score.recommendations.push('Use only one H1 tag per page');
  }

  if (h2Count >= 2) {
    score.points += 3;
    score.findings.push('✓ Multiple H2 sections for content organization');
  }

  // Check for images
  const images = $('img');
  if (images.length > 0) {
    score.points += 3;
    score.findings.push(`✓ ${images.length} image(s) found`);

    // Check for alt tags
    const imagesWithAlt = images.filter((i, el) => $(el).attr('alt'));
    if (imagesWithAlt.length === images.length) {
      score.points += 2;
      score.findings.push('✓ All images have alt attributes');
    } else {
      score.recommendations.push('Add alt attributes to all images for accessibility');
    }
  } else {
    score.recommendations.push('Consider adding relevant images to increase engagement');
  }

  // Check for video
  const hasVideo = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], [class*="video"]').length > 0;
  if (hasVideo) {
    score.points += 3;
    score.findings.push('✓ Video content detected (can increase conversions 80%+)');
  }

  return score;
}

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  let validUrl;
  try {
    validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    // Fetch the page
    const response = await axios.get(validUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Run all analyses
    const analyses = {
      headline: analyzeHeadline($),
      cta: analyzeCTA($),
      trustSignals: analyzeTrustSignals($),
      valueProposition: analyzeValueProposition($),
      form: analyzeForm($),
      mobile: analyzeMobileOptimization($),
      pageStructure: analyzePageStructure($),
    };

    // Calculate total score
    let totalPoints = 0;
    let maxPoints = 0;

    Object.values(analyses).forEach(analysis => {
      totalPoints += analysis.points;
      maxPoints += analysis.max;
    });

    const overallScore = Math.round((totalPoints / maxPoints) * 100);

    // Determine grade
    let grade, gradeClass;
    if (overallScore >= 90) { grade = 'A+'; gradeClass = 'excellent'; }
    else if (overallScore >= 80) { grade = 'A'; gradeClass = 'great'; }
    else if (overallScore >= 70) { grade = 'B'; gradeClass = 'good'; }
    else if (overallScore >= 60) { grade = 'C'; gradeClass = 'average'; }
    else if (overallScore >= 50) { grade = 'D'; gradeClass = 'below-average'; }
    else { grade = 'F'; gradeClass = 'poor'; }

    // Get page title
    const pageTitle = $('title').text().trim() || validUrl.hostname;

    // Compile all recommendations
    const allRecommendations = [];
    Object.entries(analyses).forEach(([category, analysis]) => {
      analysis.recommendations.forEach(rec => {
        allRecommendations.push({ category, recommendation: rec });
      });
    });

    res.json({
      success: true,
      url: validUrl.href,
      pageTitle,
      overallScore,
      grade,
      gradeClass,
      analyses,
      recommendations: allRecommendations,
      analyzedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analysis error:', error.message);

    if (error.code === 'ENOTFOUND') {
      return res.status(400).json({ error: 'Could not reach the website. Please check the URL.' });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(400).json({ error: 'Connection refused by the server.' });
    }
    if (error.response?.status === 403) {
      return res.status(400).json({ error: 'Access denied by the website. The site may be blocking automated requests.' });
    }
    if (error.response?.status === 404) {
      return res.status(400).json({ error: 'Page not found (404).' });
    }

    res.status(500).json({ error: 'Failed to analyze the page. Please try again.' });
  }
});

// Lead capture endpoint
app.post('/api/leads', (req, res) => {
  const { email, url, score } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // In production, you'd save this to a database or CRM
  console.log('New lead captured:', { email, url, score, timestamp: new Date().toISOString() });

  res.json({ success: true, message: 'Thank you! Check your email for the full report.' });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Landing Page Grader running at http://localhost:${PORT}`);
});
