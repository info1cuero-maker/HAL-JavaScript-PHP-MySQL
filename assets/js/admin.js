/**
 * HAL CMS Admin Panel JavaScript
 */

// Check auth and role
(async function() {
    // Check if user exists in localStorage
    if (!HAL.state.user || !HAL.state.token) {
        window.location.href = '/login?redirect=/admin';
        return;
    }
    
    // Verify token with server
    try {
        const user = await HAL.api.get('/auth/me');
        // Update local state with server data
        HAL.state.user = user;
        localStorage.setItem('hal_user', JSON.stringify(user));
        
        // Check role
        if (!['admin', 'analyst'].includes(user.role)) {
            alert('Доступ заборонено. Потрібна роль Admin або Analyst.');
            window.location.href = '/';
            return;
        }
        
        // Set user info in UI
        document.getElementById('admin-name').textContent = user.name;
        document.getElementById('admin-role').textContent = user.role === 'admin' ? 'Адміністратор' : 'Аналітик';
        document.getElementById('admin-role').classList.add(user.role);
        
        // Initialize admin panel
        initAdminPanel();
        
    } catch (error) {
        console.error('Auth verification failed:', error);
        // Token invalid - clear and redirect
        HAL.logout();
        window.location.href = '/login?redirect=/admin&error=session_expired';
        return;
    }
})();

function initAdminPanel() {
    // Load initial section from hash
    window.addEventListener('hashchange', () => {
        const section = window.location.hash.slice(1) || 'dashboard';
        loadSection(section);
    });

    if (window.location.hash) {
        loadSection(window.location.hash.slice(1));
    } else {
        loadSection('dashboard');
    }
}

// State
const adminState = {
    currentSection: 'dashboard',
    isAnalyst: HAL.state.user?.role === 'analyst',
    categories: [],
    blogCategories: []
};

// Toggle sidebar on mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        loadSection(section);
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
    });
});

// Section loader
function loadSection(section) {
    adminState.currentSection = section;
    window.location.hash = section;
    
    const titles = {
        dashboard: 'Дашборд',
        categories: 'Категорії',
        companies: 'Компанії',
        'blog-categories': 'Категорії блогу',
        blog: 'Блог',
        reviews: 'Відгуки',
        pages: 'Сторінки (SEO)',
        users: 'Користувачі',
        messages: 'Повідомлення',
        settings: 'Налаштування',
        logs: 'Логи дій'
    };
    
    document.getElementById('page-title').textContent = titles[section] || section;
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Load section content
    const loaders = {
        dashboard: loadDashboard,
        categories: loadCategories,
        companies: loadCompanies,
        'blog-categories': loadBlogCategories,
        blog: loadBlogPosts,
        reviews: loadReviews,
        pages: loadPages,
        users: loadUsers,
        messages: loadMessages,
        settings: loadSettings,
        logs: loadLogs
    };
    
    if (loaders[section]) {
        loaders[section]();
    }
}

// ==================== DASHBOARD ====================

async function loadDashboard() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const stats = await HAL.api.get('/admin/dashboard');
        
        // Update badges
        if (stats.reviews.pending > 0) {
            document.getElementById('pending-reviews-badge').style.display = 'inline';
            document.getElementById('pending-reviews-badge').textContent = stats.reviews.pending;
        }
        if (stats.messages.unread > 0) {
            document.getElementById('unread-messages-badge').style.display = 'inline';
            document.getElementById('unread-messages-badge').textContent = stats.messages.unread;
        }
        
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">👁️</div>
                    <div class="stat-value">${stats.views_today}</div>
                    <div class="stat-label">Переглядів сьогодні</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏢</div>
                    <div class="stat-value">${stats.companies.total}</div>
                    <div class="stat-label">Компаній (${stats.companies.active} активних)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">${stats.users}</div>
                    <div class="stat-label">Користувачів</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">${stats.reviews.total}</div>
                    <div class="stat-label">Відгуків (${stats.reviews.pending} очікують)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-value">${stats.blog.total}</div>
                    <div class="stat-label">Статей (${stats.blog.published} опубліковано)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✉️</div>
                    <div class="stat-value">${stats.messages.total}</div>
                    <div class="stat-label">Повідомлень (${stats.messages.unread} непрочитаних)</div>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Останні дії</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Час</th>
                            <th>Користувач</th>
                            <th>Дія</th>
                            <th>Об'єкт</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.recent_logs.map(log => `
                            <tr>
                                <td>${formatDateTime(log.created_at)}</td>
                                <td>User #${log.user_id}</td>
                                <td><span class="status-badge">${log.action}</span></td>
                                <td>${log.entity_type} #${log.entity_id || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка завантаження: ${error.message}</p></div>`;
    }
}

// ==================== CATEGORIES ====================

async function loadCategories() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const categories = await HAL.api.get('/admin/categories');
        adminState.categories = categories;
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Категорії компаній</h3>
                    <div class="table-actions">
                        ${!adminState.isAnalyst ? `<button class="btn btn-primary" onclick="openCategoryModal()">+ Додати категорію</button>` : ''}
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Іконка</th>
                            <th>Slug</th>
                            <th>Назва (UA)</th>
                            <th>Батьківська</th>
                            <th>Компаній</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(cat => `
                            <tr style="${cat.parent_id ? 'background: #f8fafc' : ''}">
                                <td>${getIconEmoji(cat.icon)}</td>
                                <td><code>${cat.parent_id ? '↳ ' : ''}${cat.slug}</code></td>
                                <td>${cat.parent_id ? '<span style="color: var(--text-light)">└─</span> ' : ''}${cat.name_uk}</td>
                                <td>${cat.parent_name || '—'}</td>
                                <td>${cat.companies_count}</td>
                                <td><span class="status-badge ${cat.is_active ? 'active' : 'inactive'}">${cat.is_active ? 'Активна' : 'Неактивна'}</span></td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="openCategoryModal(${cat.id})" title="Редагувати">✏️</button>
                                    ${!adminState.isAnalyst && cat.companies_count == 0 ? `<button class="btn-icon delete" onclick="deleteCategory(${cat.id})" title="Видалити">🗑️</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

function openCategoryModal(id = null) {
    const cat = id ? adminState.categories.find(c => c.id === id) : null;
    const isEdit = !!cat;
    
    // Get parent categories for dropdown
    const parentOptions = adminState.categories
        .filter(c => !c.parent_id && c.id !== id) // Only root categories, exclude self
        .map(c => `<option value="${c.id}" ${cat?.parent_id == c.id ? 'selected' : ''}>${c.name_uk}</option>`)
        .join('');
    
    openModal(isEdit ? 'Редагувати категорію' : 'Нова категорія', `
        <form id="category-form" onsubmit="saveCategory(event, ${id || 'null'})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Slug *</label>
                    <input type="text" class="form-input" name="slug" value="${cat?.slug || ''}" required ${isEdit ? 'readonly' : ''}>
                </div>
                <div class="form-group">
                    <label class="form-label">Іконка</label>
                    <input type="text" class="form-input" name="icon" value="${cat?.icon || 'folder'}" placeholder="folder">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Батьківська категорія</label>
                <select class="form-input" name="parent_id">
                    <option value="">-- Немає (коренева) --</option>
                    ${parentOptions}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Назва (UA) *</label>
                    <input type="text" class="form-input" name="name_uk" value="${cat?.name_uk || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Назва (RU) *</label>
                    <input type="text" class="form-input" name="name_ru" value="${cat?.name_ru || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Опис (UA)</label>
                    <textarea class="form-textarea" name="description_uk" rows="2">${cat?.description_uk || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Опис (RU)</label>
                    <textarea class="form-textarea" name="description_ru" rows="2">${cat?.description_ru || ''}</textarea>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Порядок сортування</label>
                    <input type="number" class="form-input" name="sort_order" value="${cat?.sort_order || 0}">
                </div>
                <div class="form-group">
                    <label class="form-label">Статус</label>
                    <select class="form-input" name="is_active">
                        <option value="1" ${cat?.is_active !== false ? 'selected' : ''}>Активна</option>
                        <option value="0" ${cat?.is_active === false ? 'selected' : ''}>Неактивна</option>
                    </select>
                </div>
            </div>
            
            <details style="margin-top: 1rem; padding: 1rem; background: var(--bg-gray); border-radius: var(--radius);">
                <summary style="cursor: pointer; font-weight: 500; margin-bottom: 1rem;">🔍 SEO налаштування</summary>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Title (UA)</label>
                        <input type="text" class="form-input" name="meta_title_uk" value="${cat?.meta_title_uk || ''}" placeholder="Заголовок для пошукових систем">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Title (RU)</label>
                        <input type="text" class="form-input" name="meta_title_ru" value="${cat?.meta_title_ru || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Description (UA)</label>
                        <textarea class="form-textarea" name="meta_description_uk" rows="2" placeholder="Опис для пошукових систем (до 160 символів)">${cat?.meta_description_uk || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Description (RU)</label>
                        <textarea class="form-textarea" name="meta_description_ru" rows="2">${cat?.meta_description_ru || ''}</textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (UA)</label>
                        <input type="text" class="form-input" name="meta_keywords_uk" value="${cat?.meta_keywords_uk || ''}" placeholder="ключове слово 1, ключове слово 2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (RU)</label>
                        <input type="text" class="form-input" name="meta_keywords_ru" value="${cat?.meta_keywords_ru || ''}">
                    </div>
                </div>
            </details>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                <button type="submit" class="btn btn-primary">Зберегти</button>
            </div>
        </form>
    `, 'large');
}

async function saveCategory(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    data.is_active = data.is_active === '1';
    data.sort_order = parseInt(data.sort_order) || 0;
    data.parent_id = data.parent_id ? parseInt(data.parent_id) : null;
    
    try {
        if (id) {
            await HAL.api.put(`/admin/categories/${id}`, data);
        } else {
            await HAL.api.post('/admin/categories', data);
        }
        closeModal();
        HAL.showToast('Категорію збережено');
        loadCategories();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Видалити цю категорію?')) return;
    
    try {
        await HAL.api.delete(`/admin/categories/${id}`);
        HAL.showToast('Категорію видалено');
        loadCategories();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== COMPANIES ====================

async function loadCompanies(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        // Load categories for filter
        if (adminState.categories.length === 0) {
            adminState.categories = await HAL.api.get('/admin/categories');
        }
        
        const data = await HAL.api.get(`/admin/companies?page=${page}&limit=20`);
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Компанії (${data.total})</h3>
                    <div class="table-actions">
                        <select class="filter-select" onchange="filterCompanies(this.value)">
                            <option value="">Всі статуси</option>
                            <option value="active">Активні</option>
                            <option value="inactive">Неактивні</option>
                        </select>
                        ${!adminState.isAnalyst ? `<button class="btn btn-primary" onclick="openCompanyModal()">+ Додати компанію</button>` : ''}
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Фото</th>
                            <th>Назва</th>
                            <th>Категорія</th>
                            <th>Рейтинг</th>
                            <th>Власник</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.companies.map(c => `
                            <tr>
                                <td><img src="${c.main_image ? '/uploads/companies/' + c.main_image : 'https://via.placeholder.com/48'}" class="table-image" alt=""></td>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.category_name || '-'}</td>
                                <td>⭐ ${c.rating} (${c.review_count})</td>
                                <td>${c.owner_name || '-'}</td>
                                <td><span class="status-badge ${c.is_active ? 'active' : 'inactive'}">${c.is_active ? 'Активна' : 'Неактивна'}</span></td>
                                <td class="actions">
                                    <button class="btn-icon view" onclick="window.open('/company/${c.id}', '_blank')" title="Переглянути">👁️</button>
                                    <button class="btn-icon edit" onclick="openCompanyModal(${c.id})" title="Редагувати">✏️</button>
                                    ${!adminState.isAnalyst ? `<button class="btn-icon delete" onclick="confirmDeleteCompany(${c.id})" title="Видалити">🗑️</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${renderPagination(data.page, data.pages, 'loadCompanies')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

async function openCompanyModal(id = null) {
    let company = null;
    if (id) {
        company = await HAL.api.get(`/admin/companies/${id}`);
    }
    
    const isEdit = !!company;
    
    openModal(isEdit ? 'Редагувати компанію' : 'Нова компанія', `
        <form id="company-form" onsubmit="saveCompany(event, ${id || 'null'})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Назва (UA) *</label>
                    <input type="text" class="form-input" name="name" value="${company?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Назва (RU) *</label>
                    <input type="text" class="form-input" name="name_ru" value="${company?.name_ru || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Опис (UA) *</label>
                <textarea class="form-textarea" name="description" rows="3" required>${company?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Опис (RU) *</label>
                <textarea class="form-textarea" name="description_ru" rows="3" required>${company?.description_ru || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Категорія</label>
                    <select class="form-input" name="category_id">
                        <option value="">-- Оберіть --</option>
                        ${adminState.categories.map(c => `<option value="${c.id}" ${company?.category_id == c.id ? 'selected' : ''}>${c.name_uk}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Місто *</label>
                    <input type="text" class="form-input" name="city" value="${company?.city || 'Київ'}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Адреса *</label>
                <input type="text" class="form-input" name="address" value="${company?.address || ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Телефон *</label>
                    <input type="tel" class="form-input" name="phone" value="${company?.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" name="email" value="${company?.email || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Веб-сайт</label>
                <input type="url" class="form-input" name="website" value="${company?.website || ''}" placeholder="https://">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Статус</label>
                    <select class="form-input" name="is_active">
                        <option value="1" ${company?.is_active !== false ? 'selected' : ''}>Активна</option>
                        <option value="0" ${company?.is_active === false ? 'selected' : ''}>Неактивна</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Рекомендована</label>
                    <select class="form-input" name="is_featured">
                        <option value="0" ${!company?.is_featured ? 'selected' : ''}>Ні</option>
                        <option value="1" ${company?.is_featured ? 'selected' : ''}>Так</option>
                    </select>
                </div>
            </div>
            
            <details style="margin-top: 1rem; padding: 1rem; background: var(--bg-gray); border-radius: var(--radius);">
                <summary style="cursor: pointer; font-weight: 500; margin-bottom: 1rem;">🔍 SEO налаштування</summary>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Title (UA)</label>
                        <input type="text" class="form-input" name="meta_title_uk" value="${company?.meta_title_uk || ''}" placeholder="Заголовок для пошукових систем">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Title (RU)</label>
                        <input type="text" class="form-input" name="meta_title_ru" value="${company?.meta_title_ru || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Description (UA)</label>
                        <textarea class="form-textarea" name="meta_description_uk" rows="2" placeholder="Опис для пошукових систем">${company?.meta_description_uk || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Description (RU)</label>
                        <textarea class="form-textarea" name="meta_description_ru" rows="2">${company?.meta_description_ru || ''}</textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (UA)</label>
                        <input type="text" class="form-input" name="meta_keywords_uk" value="${company?.meta_keywords_uk || ''}" placeholder="ключове слово 1, ключове слово 2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (RU)</label>
                        <input type="text" class="form-input" name="meta_keywords_ru" value="${company?.meta_keywords_ru || ''}">
                    </div>
                </div>
            </details>
            
            ${isEdit ? `
            <div class="form-group" style="margin-top: 1rem;">
                <label class="form-label">Зображення (WebP, макс. 10)</label>
                <div class="image-upload-grid" id="images-grid">
                    ${(company.images || []).map(img => `
                        <div class="image-upload-item ${img.is_main ? 'main' : ''}" data-id="${img.id}">
                            <img src="/uploads/companies/${img.filename}" alt="">
                            <button type="button" class="remove-btn" onclick="deleteCompanyImage(${img.id})">×</button>
                            ${!img.is_main ? `<button type="button" class="main-btn" onclick="setMainImage(${company.id}, ${img.id})">Головне</button>` : ''}
                        </div>
                    `).join('')}
                    ${(company.images || []).length < 10 ? `
                    <label class="image-upload-item image-upload-add">
                        <input type="file" accept=".webp" style="display:none" onchange="uploadCompanyImage(${company.id}, this)">
                        +
                    </label>
                    ` : ''}
                </div>
                <small style="color: var(--text-gray)">Тільки формат WebP</small>
            </div>
            ` : '<p style="color: var(--text-gray); margin-bottom: 1rem;">Зображення можна додати після збереження компанії</p>'}
            
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                <button type="submit" class="btn btn-primary">Зберегти</button>
            </div>
        </form>
    `, 'large');
}

async function saveCompany(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    data.is_active = data.is_active === '1';
    data.is_featured = data.is_featured === '1';
    data.category_id = data.category_id ? parseInt(data.category_id) : null;
    
    try {
        if (id) {
            await HAL.api.put(`/admin/companies/${id}`, data);
        } else {
            const result = await HAL.api.post('/admin/companies', data);
            id = result.id;
        }
        closeModal();
        HAL.showToast('Компанію збережено');
        loadCompanies();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

function confirmDeleteCompany(id) {
    openModal('Видалити компанію', `
        <div class="delete-confirm">
            <p>Ви впевнені, що хочете видалити цю компанію?</p>
            <label class="checkbox-label">
                <input type="checkbox" id="delete-media-checkbox">
                Також видалити прикріплені медіафайли
            </label>
            <div class="btn-group">
                <button class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                <button class="btn btn-primary" style="background: #ef4444" onclick="deleteCompany(${id})">Видалити</button>
            </div>
        </div>
    `);
}

async function deleteCompany(id) {
    const deleteMedia = document.getElementById('delete-media-checkbox')?.checked;
    
    try {
        await HAL.api.delete(`/admin/companies/${id}?delete_media=${deleteMedia}`);
        closeModal();
        HAL.showToast('Компанію видалено');
        loadCompanies();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function uploadCompanyImage(companyId, input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.webp')) {
        HAL.showToast('Дозволено тільки WebP формат', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`/api/admin/companies/${companyId}/images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HAL.state.token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        HAL.showToast('Зображення завантажено');
        openCompanyModal(companyId); // Refresh modal
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function deleteCompanyImage(imageId) {
    if (!confirm('Видалити це зображення?')) return;
    
    try {
        await HAL.api.delete(`/admin/images/${imageId}`);
        document.querySelector(`[data-id="${imageId}"]`)?.remove();
        HAL.showToast('Зображення видалено');
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function setMainImage(companyId, imageId) {
    try {
        await HAL.api.put(`/admin/companies/${companyId}/images/${imageId}/main`, {});
        openCompanyModal(companyId); // Refresh
        HAL.showToast('Головне зображення оновлено');
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== BLOG CATEGORIES ====================

async function loadBlogCategories() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const categories = await HAL.api.get('/admin/blog-categories');
        adminState.blogCategories = categories;
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Категорії блогу</h3>
                    <div class="table-actions">
                        ${!adminState.isAnalyst ? `<button class="btn btn-primary" onclick="openBlogCategoryModal()">+ Додати категорію</button>` : ''}
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Slug</th>
                            <th>Назва (UA)</th>
                            <th>Батьківська</th>
                            <th>Статей</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(cat => `
                            <tr style="${cat.parent_id ? 'background: #f8fafc' : ''}">
                                <td><code>${cat.parent_id ? '↳ ' : ''}${cat.slug}</code></td>
                                <td>${cat.parent_id ? '<span style="color: var(--text-light)">└─</span> ' : ''}${cat.name_uk}</td>
                                <td>${cat.parent_name || '—'}</td>
                                <td>${cat.posts_count}</td>
                                <td><span class="status-badge ${cat.is_active ? 'active' : 'inactive'}">${cat.is_active ? 'Активна' : 'Неактивна'}</span></td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="openBlogCategoryModal(${cat.id})" title="Редагувати">✏️</button>
                                    ${!adminState.isAnalyst && cat.posts_count == 0 ? `<button class="btn-icon delete" onclick="deleteBlogCategory(${cat.id})" title="Видалити">🗑️</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

function openBlogCategoryModal(id = null) {
    const cat = id ? adminState.blogCategories.find(c => c.id === id) : null;
    
    // Get parent categories for dropdown
    const parentOptions = adminState.blogCategories
        .filter(c => !c.parent_id && c.id !== id)
        .map(c => `<option value="${c.id}" ${cat?.parent_id == c.id ? 'selected' : ''}>${c.name_uk}</option>`)
        .join('');
    
    openModal(cat ? 'Редагувати категорію' : 'Нова категорія', `
        <form onsubmit="saveBlogCategory(event, ${id || 'null'})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Slug *</label>
                    <input type="text" class="form-input" name="slug" value="${cat?.slug || ''}" required ${cat ? 'readonly' : ''}>
                </div>
                <div class="form-group">
                    <label class="form-label">Порядок</label>
                    <input type="number" class="form-input" name="sort_order" value="${cat?.sort_order || 0}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Батьківська категорія</label>
                <select class="form-input" name="parent_id">
                    <option value="">-- Немає (коренева) --</option>
                    ${parentOptions}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Назва (UA) *</label>
                    <input type="text" class="form-input" name="name_uk" value="${cat?.name_uk || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Назва (RU) *</label>
                    <input type="text" class="form-input" name="name_ru" value="${cat?.name_ru || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Опис (UA)</label>
                    <textarea class="form-textarea" name="description_uk" rows="2">${cat?.description_uk || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Опис (RU)</label>
                    <textarea class="form-textarea" name="description_ru" rows="2">${cat?.description_ru || ''}</textarea>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Статус</label>
                <select class="form-input" name="is_active">
                    <option value="1" ${cat?.is_active !== false ? 'selected' : ''}>Активна</option>
                    <option value="0" ${cat?.is_active === false ? 'selected' : ''}>Неактивна</option>
                </select>
            </div>
            
            <details style="margin-top: 1rem; padding: 1rem; background: var(--bg-gray); border-radius: var(--radius);">
                <summary style="cursor: pointer; font-weight: 500; margin-bottom: 1rem;">🔍 SEO налаштування</summary>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Title (UA)</label>
                        <input type="text" class="form-input" name="meta_title_uk" value="${cat?.meta_title_uk || ''}" placeholder="Заголовок для пошукових систем">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Title (RU)</label>
                        <input type="text" class="form-input" name="meta_title_ru" value="${cat?.meta_title_ru || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Description (UA)</label>
                        <textarea class="form-textarea" name="meta_description_uk" rows="2" placeholder="Опис для пошукових систем">${cat?.meta_description_uk || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Description (RU)</label>
                        <textarea class="form-textarea" name="meta_description_ru" rows="2">${cat?.meta_description_ru || ''}</textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (UA)</label>
                        <input type="text" class="form-input" name="meta_keywords_uk" value="${cat?.meta_keywords_uk || ''}" placeholder="ключове слово 1, ключове слово 2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (RU)</label>
                        <input type="text" class="form-input" name="meta_keywords_ru" value="${cat?.meta_keywords_ru || ''}">
                    </div>
                </div>
            </details>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                <button type="submit" class="btn btn-primary">Зберегти</button>
            </div>
        </form>
    `, 'large');
}

async function saveBlogCategory(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.sort_order = parseInt(data.sort_order) || 0;
    data.is_active = data.is_active === '1';
    data.parent_id = data.parent_id ? parseInt(data.parent_id) : null;
    
    try {
        if (id) {
            await HAL.api.put(`/admin/blog-categories/${id}`, data);
        } else {
            await HAL.api.post('/admin/blog-categories', data);
        }
        closeModal();
        HAL.showToast('Категорію збережено');
        loadBlogCategories();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function deleteBlogCategory(id) {
    if (!confirm('Видалити цю категорію?')) return;
    
    try {
        await HAL.api.delete(`/admin/blog-categories/${id}`);
        HAL.showToast('Категорію видалено');
        loadBlogCategories();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== BLOG POSTS ====================

async function loadBlogPosts(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        if (adminState.blogCategories.length === 0) {
            adminState.blogCategories = await HAL.api.get('/admin/blog-categories');
        }
        
        const data = await HAL.api.get(`/admin/blog?page=${page}`);
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Статті блогу (${data.total})</h3>
                    <div class="table-actions">
                        <select class="filter-select" onchange="filterBlogPosts(this.value)">
                            <option value="">Всі статуси</option>
                            <option value="draft">Чернетки</option>
                            <option value="published">Опубліковані</option>
                        </select>
                        ${!adminState.isAnalyst ? `<button class="btn btn-primary" onclick="openBlogPostModal()">+ Нова стаття</button>` : ''}
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Заголовок</th>
                            <th>Категорія</th>
                            <th>Автор</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.posts.map(p => `
                            <tr>
                                <td><strong>${p.title_uk}</strong></td>
                                <td>${p.category_name || '-'}</td>
                                <td>${p.author_name || '-'}</td>
                                <td><span class="status-badge ${p.status}">${p.status === 'published' ? 'Опубліковано' : p.status === 'draft' ? 'Чернетка' : 'Архів'}</span></td>
                                <td>${p.published_at ? formatDate(p.published_at) : '-'}</td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="openBlogPostModal(${p.id})" title="Редагувати">✏️</button>
                                    ${!adminState.isAnalyst ? `<button class="btn-icon delete" onclick="deleteBlogPost(${p.id})" title="Видалити">🗑️</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

async function openBlogPostModal(id = null) {
    let post = null;
    if (id) {
        const data = await HAL.api.get(`/blog/${id}`);
        post = data;
    }
    
    openModal(post ? 'Редагувати статтю' : 'Нова стаття', `
        <form onsubmit="saveBlogPost(event, ${id || 'null'})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Заголовок (UA) *</label>
                    <input type="text" class="form-input" name="title_uk" value="${post?.title_uk || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Заголовок (RU) *</label>
                    <input type="text" class="form-input" name="title_ru" value="${post?.title_ru || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Категорія</label>
                    <select class="form-input" name="category_id">
                        <option value="">-- Без категорії --</option>
                        ${adminState.blogCategories.map(c => `<option value="${c.id}" ${post?.category_id == c.id ? 'selected' : ''}>${c.name_uk}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Статус</label>
                    <select class="form-input" name="status">
                        <option value="draft" ${post?.status === 'draft' ? 'selected' : ''}>Чернетка</option>
                        <option value="published" ${post?.status === 'published' ? 'selected' : ''}>Опублікувати</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Короткий опис (UA) *</label>
                <textarea class="form-textarea" name="excerpt_uk" rows="2" required>${post?.excerpt_uk || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Короткий опис (RU) *</label>
                <textarea class="form-textarea" name="excerpt_ru" rows="2" required>${post?.excerpt_ru || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Контент (UA) *</label>
                <textarea class="form-textarea" name="content_uk" rows="6" required>${post?.content_uk || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Контент (RU) *</label>
                <textarea class="form-textarea" name="content_ru" rows="6" required>${post?.content_ru || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">URL зображення</label>
                <input type="text" class="form-input" name="featured_image" value="${post?.featured_image || post?.image || ''}" placeholder="https://...">
            </div>
            
            <details style="margin-top: 1rem; padding: 1rem; background: var(--bg-gray); border-radius: var(--radius);">
                <summary style="cursor: pointer; font-weight: 500; margin-bottom: 1rem;">🔍 SEO налаштування</summary>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Title (UA)</label>
                        <input type="text" class="form-input" name="meta_title_uk" value="${post?.meta_title_uk || ''}" placeholder="Заголовок для пошукових систем">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Title (RU)</label>
                        <input type="text" class="form-input" name="meta_title_ru" value="${post?.meta_title_ru || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Description (UA)</label>
                        <textarea class="form-textarea" name="meta_description_uk" rows="2" placeholder="Опис для пошукових систем">${post?.meta_description_uk || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Description (RU)</label>
                        <textarea class="form-textarea" name="meta_description_ru" rows="2">${post?.meta_description_ru || ''}</textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (UA)</label>
                        <input type="text" class="form-input" name="meta_keywords_uk" value="${post?.meta_keywords_uk || ''}" placeholder="ключове слово 1, ключове слово 2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (RU)</label>
                        <input type="text" class="form-input" name="meta_keywords_ru" value="${post?.meta_keywords_ru || ''}">
                    </div>
                </div>
            </details>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                <button type="submit" class="btn btn-primary">Зберегти</button>
            </div>
        </form>
    `, 'large');
}

async function saveBlogPost(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.category_id = data.category_id ? parseInt(data.category_id) : null;
    
    try {
        if (id) {
            await HAL.api.put(`/admin/blog/${id}`, data);
        } else {
            await HAL.api.post('/admin/blog', data);
        }
        closeModal();
        HAL.showToast('Статтю збережено');
        loadBlogPosts();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function deleteBlogPost(id) {
    if (!confirm('Видалити цю статтю?')) return;
    
    try {
        await HAL.api.delete(`/admin/blog/${id}`);
        HAL.showToast('Статтю видалено');
        loadBlogPosts();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== REVIEWS ====================

async function loadReviews(status = 'pending') {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const data = await HAL.api.get(`/admin/reviews?status=${status}`);
        
        content.innerHTML = `
            <div class="tabs">
                <button class="tab ${status === 'pending' ? 'active' : ''}" onclick="loadReviews('pending')">Очікують (${status === 'pending' ? data.total : '?'})</button>
                <button class="tab ${status === 'approved' ? 'active' : ''}" onclick="loadReviews('approved')">Схвалені</button>
                <button class="tab ${status === 'rejected' ? 'active' : ''}" onclick="loadReviews('rejected')">Відхилені</button>
            </div>
            
            <div class="data-table-container" style="padding: 1.5rem">
                ${data.reviews.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">✅</div>
                        <p>Немає відгуків для модерації</p>
                    </div>
                ` : data.reviews.map(r => `
                    <div class="review-item">
                        <div class="review-header">
                            <div>
                                <strong>${r.user_name}</strong>
                                <span class="review-meta"> • ${r.user_email || 'без email'} • ${formatDateTime(r.created_at)}</span>
                            </div>
                            <div>
                                <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                            </div>
                        </div>
                        <div class="review-meta" style="margin-bottom: 0.5rem">
                            Компанія: <a href="/company/${r.company_id}" target="_blank" class="review-company">${r.company_name}</a>
                        </div>
                        <p class="review-text">${r.comment}</p>
                        ${status === 'pending' && !adminState.isAnalyst ? `
                        <div class="review-actions">
                            <button class="btn btn-primary" onclick="moderateReview(${r.id}, 'approved')">✓ Схвалити</button>
                            <button class="btn btn-outline" onclick="moderateReview(${r.id}, 'rejected')">✗ Відхилити</button>
                        </div>
                        ` : ''}
                        ${status !== 'pending' && !adminState.isAnalyst ? `
                        <div class="review-actions">
                            <button class="btn btn-outline" style="color: #ef4444" onclick="deleteReview(${r.id})">Видалити</button>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

async function moderateReview(id, status) {
    try {
        await HAL.api.put(`/admin/reviews/${id}/moderate`, { status });
        HAL.showToast(`Відгук ${status === 'approved' ? 'схвалено' : 'відхилено'}`);
        loadReviews('pending');
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function deleteReview(id) {
    if (!confirm('Видалити цей відгук?')) return;
    
    try {
        await HAL.api.delete(`/admin/reviews/${id}`);
        HAL.showToast('Відгук видалено');
        loadReviews(adminState.currentReviewStatus || 'approved');
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== USERS ====================

async function loadUsers() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const users = await HAL.api.get('/admin/users');
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Користувачі (${users.length})</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ім'я</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Компаній</th>
                            <th>Статус</th>
                            <th>Реєстрація</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>#${u.id}</td>
                                <td><strong>${u.name}</strong></td>
                                <td>${u.email}</td>
                                <td><span class="role-badge ${u.role}">${u.role}</span></td>
                                <td>${u.companies_count}</td>
                                <td><span class="status-badge ${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Активний' : 'Заблокований'}</span></td>
                                <td>${formatDate(u.created_at)}</td>
                                <td class="actions">
                                    ${!adminState.isAnalyst && u.id !== HAL.state.user.id ? `
                                        <button class="btn-icon edit" onclick="openUserRoleModal(${u.id}, '${u.role}')" title="Змінити роль">👤</button>
                                        <button class="btn-icon ${u.is_active ? 'delete' : 'view'}" onclick="toggleUserStatus(${u.id})" title="${u.is_active ? 'Заблокувати' : 'Розблокувати'}">${u.is_active ? '🔒' : '🔓'}</button>
                                    ` : '-'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

function openUserRoleModal(userId, currentRole) {
    openModal('Змінити роль', `
        <form onsubmit="updateUserRole(event, ${userId})">
            <div class="form-group">
                <label class="form-label">Роль</label>
                <select class="form-input" name="role">
                    <option value="user" ${currentRole === 'user' ? 'selected' : ''}>Користувач</option>
                    <option value="analyst" ${currentRole === 'analyst' ? 'selected' : ''}>Аналітик (тільки перегляд)</option>
                    <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Адміністратор</option>
                </select>
            </div>
            <p style="color: var(--text-gray); font-size: 0.875rem; margin-bottom: 1rem">
                <strong>Користувач</strong> - може редагувати тільки свої компанії<br>
                <strong>Аналітик</strong> - доступ до адмінки, тільки перегляд<br>
                <strong>Адміністратор</strong> - повний доступ
            </p>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                <button type="submit" class="btn btn-primary">Зберегти</button>
            </div>
        </form>
    `);
}

async function updateUserRole(e, userId) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    
    try {
        await HAL.api.put(`/admin/users/${userId}/role`, data);
        closeModal();
        HAL.showToast('Роль оновлено');
        loadUsers();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function toggleUserStatus(userId) {
    try {
        await HAL.api.put(`/admin/users/${userId}/toggle-status`, {});
        HAL.showToast('Статус оновлено');
        loadUsers();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== MESSAGES ====================

async function loadMessages() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const messages = await HAL.api.get('/admin/messages');
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Повідомлення (${messages.length})</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Статус</th>
                            <th>Ім'я</th>
                            <th>Email</th>
                            <th>Повідомлення</th>
                            <th>Дата</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${messages.map(m => `
                            <tr style="${!m.is_read ? 'background: #fef3c7' : ''}">
                                <td>${m.is_read ? '✅' : '🔔'}</td>
                                <td><strong>${m.name}</strong></td>
                                <td><a href="mailto:${m.email}">${m.email}</a></td>
                                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${m.message}</td>
                                <td>${formatDateTime(m.created_at)}</td>
                                <td class="actions">
                                    <button class="btn-icon view" onclick="viewMessage(${m.id}, '${m.name}', '${m.email}', \`${m.message.replace(/`/g, "'")}\`)" title="Переглянути">👁️</button>
                                    ${!adminState.isAnalyst ? `<button class="btn-icon delete" onclick="deleteMessage(${m.id})" title="Видалити">🗑️</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

async function viewMessage(id, name, email, message) {
    // Mark as read
    await HAL.api.put(`/admin/messages/${id}/read`, {});
    
    openModal('Повідомлення', `
        <p><strong>Від:</strong> ${name} (${email})</p>
        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border)">
        <p style="white-space: pre-wrap; line-height: 1.6">${message}</p>
        <div class="modal-footer">
            <a href="mailto:${email}" class="btn btn-primary">Відповісти</a>
            <button class="btn btn-outline" onclick="closeModal()">Закрити</button>
        </div>
    `);
    
    loadMessages(); // Refresh
}

async function deleteMessage(id) {
    if (!confirm('Видалити це повідомлення?')) return;
    
    try {
        await HAL.api.delete(`/admin/messages/${id}`);
        HAL.showToast('Повідомлення видалено');
        loadMessages();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== SETTINGS ====================

async function loadSettings() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const settings = await HAL.api.get('/admin/settings');
        
        content.innerHTML = `
            <div class="data-table-container" style="padding: 1.5rem">
                <h3 class="table-title" style="margin-bottom: 1.5rem">Налаштування сайту</h3>
                
                <form id="settings-form" onsubmit="saveSettings(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Назва сайту</label>
                            <input type="text" class="form-input" name="site_name" value="${settings.site_name?.value || ''}" ${adminState.isAnalyst ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email для контактів</label>
                            <input type="email" class="form-input" name="contact_email" value="${settings.contact_email?.value || ''}" ${adminState.isAnalyst ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Опис сайту</label>
                        <textarea class="form-textarea" name="site_description" rows="2" ${adminState.isAnalyst ? 'disabled' : ''}>${settings.site_description?.value || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Телефон</label>
                            <input type="text" class="form-input" name="contact_phone" value="${settings.contact_phone?.value || ''}" ${adminState.isAnalyst ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Адреса</label>
                            <input type="text" class="form-input" name="contact_address" value="${settings.contact_address?.value || ''}" ${adminState.isAnalyst ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Компаній на сторінку</label>
                            <input type="number" class="form-input" name="companies_per_page" value="${settings.companies_per_page?.value || 20}" ${adminState.isAnalyst ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Статей на сторінку</label>
                            <input type="number" class="form-input" name="blog_posts_per_page" value="${settings.blog_posts_per_page?.value || 10}" ${adminState.isAnalyst ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" name="reviews_moderation" ${settings.reviews_moderation?.value === 'true' ? 'checked' : ''} ${adminState.isAnalyst ? 'disabled' : ''}>
                            Модерація відгуків (відгуки публікуються тільки після схвалення)
                        </label>
                    </div>
                    
                    ${!adminState.isAnalyst ? `
                    <button type="submit" class="btn btn-primary btn-lg">Зберегти налаштування</button>
                    ` : ''}
                </form>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

async function saveSettings(e) {
    e.preventDefault();
    const form = e.target;
    const data = {};
    
    form.querySelectorAll('input, textarea').forEach(el => {
        if (el.type === 'checkbox') {
            data[el.name] = el.checked ? 'true' : 'false';
        } else {
            data[el.name] = el.value;
        }
    });
    
    try {
        await HAL.api.put('/admin/settings', data);
        HAL.showToast('Налаштування збережено');
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

// ==================== LOGS ====================

async function loadLogs(page = 1) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const logs = await HAL.api.get(`/admin/logs?page=${page}`);
        
        content.innerHTML = `
            <div class="data-table-container" style="padding: 1.5rem">
                <h3 class="table-title" style="margin-bottom: 1rem">Логи дій адміністраторів</h3>
                
                ${logs.map(log => `
                    <div class="log-item">
                        <span class="log-time">${formatDateTime(log.created_at)}</span>
                        <span class="log-action">${log.user_name || 'User #' + log.user_id}</span>
                        <span class="log-details">
                            ${log.action} → ${log.entity_type}${log.entity_id ? ' #' + log.entity_id : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

// ==================== HELPERS ====================

function openModal(title, content, size = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal-overlay').classList.add('show');
    const modal = document.getElementById('modal');
    modal.classList.add('show');
    if (size) modal.classList.add(size);
}

// ==================== STATIC PAGES (SEO) ====================

async function loadPages() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="skeleton" style="height: 400px"></div>';
    
    try {
        const pages = await HAL.api.get('/admin/pages');
        
        const pageIcons = {
            home: '🏠',
            search: '🔍',
            blog: '📝',
            about: 'ℹ️',
            contacts: '📞'
        };
        
        content.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h3 class="table-title">Статичні сторінки та SEO налаштування</h3>
                </div>
                <p style="padding: 0 1.5rem; color: var(--text-gray); margin-bottom: 1rem">
                    Налаштуйте SEO-теги (title, description, keywords) для кожної сторінки сайту.
                </p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Сторінка</th>
                            <th>Meta Title (UA)</th>
                            <th>Meta Description (UA)</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pages.map(p => `
                            <tr>
                                <td style="font-size: 1.5rem">${pageIcons[p.slug] || '📄'}</td>
                                <td>
                                    <strong>${p.title_uk}</strong><br>
                                    <code style="font-size: 0.75rem">/${p.slug === 'home' ? '' : p.slug}</code>
                                </td>
                                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${p.meta_title_uk || '<span style="color: var(--text-light)">Не задано</span>'}</td>
                                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${p.meta_description_uk || '<span style="color: var(--text-light)">Не задано</span>'}</td>
                                <td class="actions">
                                    <button class="btn-icon edit" onclick="openPageModal(${p.id})" title="Редагувати SEO">✏️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><p>Помилка: ${error.message}</p></div>`;
    }
}

async function openPageModal(id) {
    try {
        const page = await HAL.api.get(`/admin/pages/${id}`);
        
        openModal(`Редагувати SEO: ${page.title_uk}`, `
            <form onsubmit="savePage(event, ${id})">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Заголовок сторінки (UA)</label>
                        <input type="text" class="form-input" name="title_uk" value="${page.title_uk || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Заголовок сторінки (RU)</label>
                        <input type="text" class="form-input" name="title_ru" value="${page.title_ru || ''}">
                    </div>
                </div>
                
                <h4 style="margin: 1.5rem 0 1rem; color: var(--primary)">🔍 SEO налаштування</h4>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Title (UA) *</label>
                        <input type="text" class="form-input" name="meta_title_uk" value="${page.meta_title_uk || ''}" placeholder="Заголовок для пошукових систем (до 60 символів)">
                        <small style="color: var(--text-gray)">Рекомендовано до 60 символів</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Title (RU)</label>
                        <input type="text" class="form-input" name="meta_title_ru" value="${page.meta_title_ru || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Description (UA) *</label>
                        <textarea class="form-textarea" name="meta_description_uk" rows="3" placeholder="Опис для пошукових систем (до 160 символів)">${page.meta_description_uk || ''}</textarea>
                        <small style="color: var(--text-gray)">Рекомендовано 150-160 символів</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Description (RU)</label>
                        <textarea class="form-textarea" name="meta_description_ru" rows="3">${page.meta_description_ru || ''}</textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (UA)</label>
                        <input type="text" class="form-input" name="meta_keywords_uk" value="${page.meta_keywords_uk || ''}" placeholder="ключове слово 1, ключове слово 2, ...">
                        <small style="color: var(--text-gray)">Через кому</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Meta Keywords (RU)</label>
                        <input type="text" class="form-input" name="meta_keywords_ru" value="${page.meta_keywords_ru || ''}">
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Скасувати</button>
                    <button type="submit" class="btn btn-primary">Зберегти</button>
                </div>
            </form>
        `, 'large');
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

async function savePage(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    
    try {
        await HAL.api.put(`/admin/pages/${id}`, data);
        closeModal();
        HAL.showToast('SEO налаштування збережено');
        loadPages();
    } catch (error) {
        HAL.showToast(error.message, 'error');
    }
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
    document.getElementById('modal').classList.remove('show', 'large');
}

function logout() {
    HAL.logout();
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('uk-UA');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('uk-UA');
}

function renderPagination(current, total, funcName) {
    if (total <= 1) return '';
    
    let html = '<div class="pagination">';
    for (let i = 1; i <= total; i++) {
        html += `<button class="pagination-btn ${i === current ? 'active' : ''}" onclick="${funcName}(${i})">${i}</button>`;
    }
    html += '</div>';
    return html;
}

function getIconEmoji(icon) {
    const icons = {
        utensils: '🍽️',
        dumbbell: '💪',
        sparkles: '✨',
        palette: '🎨',
        home: '🏠',
        car: '🚗',
        hammer: '🔨',
        'more-horizontal': '📦',
        folder: '📁'
    };
    return icons[icon] || '📁';
}

// Close modal on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
