// ===== Навигация: эффект при скролле =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Мобильное меню =====
const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav-links');

burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
});

// Закрытие меню при клике на ссылку
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
    });
});

// ===== Анимация появления элементов при скролле =====
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ===== Анимация полосок навыков =====
const skillBars = document.querySelectorAll('.skill-fill');

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;
            bar.style.width = '0';
            bar.classList.add('animate');
            // Устанавливаем целевую ширину через анимацию
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
            skillObserver.unobserve(bar);
        }
    });
}, {
    threshold: 0.5
});

skillBars.forEach(bar => skillObserver.observe(bar));

// ===== Генерация карточек забегов из JSON =====
const raceGrid = document.getElementById('race-grid');

// Встроенные данные забегов (fallback для file:// и GitHub Pages).
// На сервере (GitHub Pages) данные дублируются в run_results/*.json —
// JS сначала пытается загрузить JSON, при неудаче использует эти данные.
const BUILTIN_RACES = [
    {
        "name": "North Capital",
        "date": "09.08.2026",
        "upcoming": true,
        "place": "Saint-Petersburg, Russia",
        "format": "10k",
        "distance": 10.0,
        "target": "50:00",
        "result": ""
    },
    {
        "name": "Kazan Marathon",
        "date": "03.05.2026",
        "upcoming": false,
        "place": "Kazan, Russia",
        "format": "Marathon",
        "distance": 42.2,
        "target": "3:59",
        "result": "3:59"
    },
    {
        "name": "ILOVERUNING 5k",
        "date": "11.04.2026",
        "upcoming": false,
        "place": "Saint-Petersburg, Russia",
        "format": "Local running event",
        "distance": 5,
        "target": "19:59",
        "result": "19:37"
    },
    {
        "name": "Pushkin - Petersburg",
        "date": "07.09.2025",
        "upcoming": false,
        "place": "Saint-Petersburg, Russia",
        "format": "Marathon",
        "distance": 42.2,
        "target": "finished",
        "result": "5:12"
    }
];

function formatDate(dateStr) {
    // "07.09.2025" -> "7 сентября 2025"
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const parts = dateStr.split('.');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!months[month]) return dateStr;
    return `${day} ${months[month]} ${year}`;
}

function formatDistance(distance) {
    return `${distance} км`;
}

function formatTime(time) {
    // Поддержка форматов:
    // - Число: 5.12 -> "5:12", 19.37 -> "19:37"
    // - Строка: "3:59" -> "3:59", "50:00" -> "50:00"
    if (time === undefined || time === null || time === '') return '';
    if (typeof time === 'string') return time;
    const parts = String(time).split('.');
    if (parts.length !== 2) return String(time);
    return `${parts[0]}:${parts[1].padStart(2, '0')}`;
}

function createRaceCard(run) {
    // Одна строка-таблица: дата | название · место | формат · дистанция | статус | время
    const article = document.createElement('article');
    article.className = 'news-card reveal race-card';

    // Дата
    const dateCell = document.createElement('span');
    dateCell.className = 'race-date-cell';
    dateCell.textContent = formatDate(run.date);
    article.appendChild(dateCell);

    // Название + место
    const main = document.createElement('div');
    main.className = 'race-main';
    const title = document.createElement('h3');
    title.textContent = `🏃 ${run.name}`;
    main.appendChild(title);
    const place = document.createElement('span');
    place.className = 'race-place';
    place.textContent = run.place;
    main.appendChild(place);
    article.appendChild(main);

    // Формат · дистанция
    const details = document.createElement('span');
    details.className = 'race-details-cell';
    details.textContent = `${run.format} · ${formatDistance(run.distance)}`;
    article.appendChild(details);

    // Статус
    const badge = document.createElement('span');
    badge.className = 'race-badge';
    if (run.upcoming) {
        badge.classList.add('race-upcoming');
        badge.textContent = 'Запланировано';
    } else {
        badge.classList.add('race-finished');
        badge.textContent = 'Завершено';
    }
    article.appendChild(badge);

    // Время финиша
    const resultTime = formatTime(run.result);
    const timeCell = document.createElement('span');
    timeCell.className = 'race-time-cell';
    timeCell.textContent = resultTime ? resultTime : '—';
    timeCell.classList.add(resultTime ? 'has-time' : 'no-time');
    article.appendChild(timeCell);

    return article;
}

function renderRaces(runs) {
    if (!raceGrid) return;
    if (!runs || runs.length === 0) {
        raceGrid.innerHTML = '<p class="no-races">Пока нет данных о забегах.</p>';
        return;
    }
    // Сортировка по дате: сначала новые
    runs.sort((a, b) => {
        const da = a.date.split('.').reverse().join('');
        const db = b.date.split('.').reverse().join('');
        return db.localeCompare(da);
    });
    raceGrid.innerHTML = '';
    runs.forEach(run => raceGrid.appendChild(createRaceCard(run)));

    // Подключаем reveal-анимацию к новым карточкам
    const newReveals = raceGrid.querySelectorAll('.reveal');
    newReveals.forEach(el => revealObserver.observe(el));
}

function loadRaces() {
    if (!raceGrid) return;

    // Пытаемся загрузить JSON с сервера (GitHub Pages / localhost).
    // При открытии через file:// fetch недоступен — используем встроенные данные.
    fetch('run_results/manifest.json', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('manifest not found');
            return response.json();
        })
        .then(manifest => {
            const files = manifest.runs || [];
            return Promise.all(files.map(file =>
                fetch(`run_results/${file}`, { cache: 'no-store' })
                    .then(res => {
                        if (!res.ok) throw new Error(`Failed to load ${file}`);
                        return res.json();
                    })
            ));
        })
        .then(runs => {
            if (runs && runs.length > 0) {
                renderRaces(runs);
            } else {
                renderRaces(BUILTIN_RACES);
            }
        })
        .catch(() => {
            // fetch недоступен (file://) или ошибка — используем встроенные данные
            renderRaces(BUILTIN_RACES);
        });
}

// Загружаем забеги после загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRaces);
} else {
    loadRaces();
}

// ===== Генерация таблиц науки (образование, публикации, конференции) =====
const BUILTIN_SCIENCE = {
    education: [
        {
            "name": "BSc",
            "date": "09.08.2022",
            "organization": "Dolgoprudny, Moscow Region, Russia"
        }
    ],
    articles: [
        {
            "name": "Gorny Uni",
            "date": "09.08.2022",
            "organization": "Saint-Petersburg, Russia",
            "presentation": "GeoScience Analysis"
        }
    ],
    conferences: [
        {
            "name": "MIPT 65",
            "date": "09.08.2022",
            "organization": "Dolgoprudny, Moscow Region, Russia",
            "presentation": "Water Hammer event"
        }
    ]
};

function createScienceCard(item) {
    // Строка-таблица: дата | название · организация | презентация (если есть)
    const article = document.createElement('article');
    article.className = 'news-card reveal sci-card';

    const dateCell = document.createElement('span');
    dateCell.className = 'sci-date-cell';
    dateCell.textContent = formatDate(item.date);
    article.appendChild(dateCell);

    const main = document.createElement('div');
    main.className = 'sci-main';
    const title = document.createElement('h3');
    title.textContent = item.name;
    main.appendChild(title);
    if (item.organization) {
        const org = document.createElement('span');
        org.className = 'sci-org';
        org.textContent = item.organization;
        main.appendChild(org);
    }
    article.appendChild(main);

    if (item.presentation) {
        const pres = document.createElement('span');
        pres.className = 'sci-pres';
        pres.textContent = item.presentation;
        article.appendChild(pres);
    }

    return article;
}

function renderScience(gridId, items) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (!items || items.length === 0) {
        grid.innerHTML = '';
        return;
    }
    items.sort((a, b) => {
        const da = a.date.split('.').reverse().join('');
        const db = b.date.split('.').reverse().join('');
        return db.localeCompare(da);
    });
    grid.innerHTML = '';
    items.forEach(item => grid.appendChild(createScienceCard(item)));
    const newReveals = grid.querySelectorAll('.reveal');
    newReveals.forEach(el => revealObserver.observe(el));
}

function loadScience() {
    // Пытаемся загрузить science_results/manifest.json, при неудаче — встроенные данные
    fetch('science_results/manifest.json', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('science manifest not found');
            return response.json();
        })
        .then(manifest => {
            const loadGroup = (key) => {
                const files = manifest[key] || [];
                return Promise.all(files.map(file =>
                    fetch(`science_results/${file}`, { cache: 'no-store' })
                        .then(res => {
                            if (!res.ok) throw new Error(`Failed to load ${file}`);
                            return res.json();
                        })
                ));
            };
            return Promise.all([
                loadGroup('education').catch(() => BUILTIN_SCIENCE.education),
                loadGroup('articles').catch(() => BUILTIN_SCIENCE.articles),
                loadGroup('conferences').catch(() => BUILTIN_SCIENCE.conferences)
            ]);
        })
        .then(([education, articles, conferences]) => {
            renderScience('education-grid', education);
            renderScience('articles-grid', articles);
            renderScience('conferences-grid', conferences);
        })
        .catch(() => {
            renderScience('education-grid', BUILTIN_SCIENCE.education);
            renderScience('articles-grid', BUILTIN_SCIENCE.articles);
            renderScience('conferences-grid', BUILTIN_SCIENCE.conferences);
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadScience);
} else {
    loadScience();
}

// ===== Генерация постов блога =====
const BUILTIN_POSTS = [
    {
        "title": "Добро пожаловать в мой блог",
        "date": "02.08.2026",
        "category": "Заметки",
        "content": "Здесь я буду делиться впечатлениями о прочитанных книгах, рассказывать о занимательных событиях и публиковать развёрнутые заметки. Следите за обновлениями!"
    }
];

function createBlogPost(post) {
    const article = document.createElement('article');
    article.className = 'blog-post reveal';

    const header = document.createElement('div');
    header.className = 'blog-post-header';

    const date = document.createElement('span');
    date.className = 'blog-post-date';
    date.textContent = formatDate(post.date);
    header.appendChild(date);

    if (post.category) {
        const cat = document.createElement('span');
        cat.className = 'blog-post-category';
        cat.textContent = post.category;
        header.appendChild(cat);
    }

    article.appendChild(header);

    const title = document.createElement('h2');
    title.textContent = post.title;
    article.appendChild(title);

    const content = document.createElement('p');
    content.className = 'blog-post-content';
    content.textContent = post.content;
    article.appendChild(content);

    return article;
}

function renderBlog(posts) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    if (!posts || posts.length === 0) {
        grid.innerHTML = '<p class="no-races">Пока нет записей в блоге.</p>';
        return;
    }
    posts.sort((a, b) => {
        const da = a.date.split('.').reverse().join('');
        const db = b.date.split('.').reverse().join('');
        return db.localeCompare(da);
    });
    grid.innerHTML = '';
    posts.forEach(post => grid.appendChild(createBlogPost(post)));
    const newReveals = grid.querySelectorAll('.reveal');
    newReveals.forEach(el => revealObserver.observe(el));
}

function loadBlog() {
    if (!document.getElementById('blog-grid')) return;
    fetch('blog_results/manifest.json', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('blog manifest not found');
            return response.json();
        })
        .then(manifest => {
            const files = manifest.posts || [];
            return Promise.all(files.map(file =>
                fetch(`blog_results/${file}`, { cache: 'no-store' })
                    .then(res => {
                        if (!res.ok) throw new Error(`Failed to load ${file}`);
                        return res.json();
                    })
            ));
        })
        .then(posts => {
            if (posts && posts.length > 0) {
                renderBlog(posts);
            } else {
                renderBlog(BUILTIN_POSTS);
            }
        })
        .catch(() => renderBlog(BUILTIN_POSTS));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlog);
} else {
    loadBlog();
}

// ===== Плавный скролл для якорных ссылок =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
