#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(process.cwd(), 'foidslop-meals.json');
const REDIRECTS_FILE = path.join(process.cwd(), '_redirects');

const PINTEREST_TOKEN = process.env.PINTEREST_TOKEN;
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID;

if (!PINTEREST_TOKEN || !PINTEREST_BOARD_ID) {
    console.log('⚠ Missing Pinterest secrets. Skipping pin creation.');
    process.exit(0);
}

// Find today's slug by reading the _redirects file
let currentSlug = null;
if (fs.existsSync(REDIRECTS_FILE)) {
    const content = fs.readFileSync(REDIRECTS_FILE, 'utf8');
    const match = content.match(/\/slop\/today\s+\/slop\/([^\s]+)\.html/);
    if (match) currentSlug = match[1];
}

if (!currentSlug) {
    console.log('⚠ Could not determine current slop. Skipping pin creation.');
    process.exit(0);
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const meals = db.meals || db;
const meal = meals.find(m => m.slug === currentSlug);

if (!meal) {
    console.log(`⚠ Meal not found for slug: ${currentSlug}`);
    process.exit(0);
}

const link = `https://foidslop.com/slop/${meal.slug}.html`;
const imageUrl = `https://foidslop.com/slop/img/${meal.slug}.jpg`;
const title = `${meal.name} Recipe`;
const description = meal.description.slice(0, 400); // Pinterest allows up to 800 chars

const payload = {
    board_id: PINTEREST_BOARD_ID,
    title: title,
    description: description,
    link: link,
    media_source: {
        source_type: "image_url",
        url: imageUrl
    }
};

console.log(`Pinning ${meal.name} to Pinterest...`);

fetch('https://api-sandbox.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${PINTEREST_TOKEN}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
})
.then(response => {
    if (response.ok) {
        console.log('  ✔ Successfully pinned to Pinterest!');
    } else {
        return response.json().then(err => {
            console.error('✖ Pinterest API Error:', err.message || err);
        });
    }
})
.catch(err => {
    console.error('✖ Network Error pinning to Pinterest:', err.message);
});
