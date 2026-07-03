class GithubProfileFinder {
    constructor() {
        this.searchBtn = document.getElementById("searchBtn");
        this.searchInput = document.getElementById("searchInput");
        this.skeleton = document.getElementById("skeleton");
        this.profileContainer = document.getElementById("profileContainer");
        this.errorMsg = document.getElementById("errorMsg");
        this.repoContainer = document.getElementById("repoContainer");
        this.languageSummary = document.getElementById("languageSummary");
        this.sortRepos = document.getElementById("sortRepos");
        this.recentSearches = document.getElementById("recentSearches");
        this.repos = [];
        this.searchBtn.onclick = () => this.handleSearch();
        this.searchInput.addEventListener("keypress", e => e.key === "Enter" && this.handleSearch());
        this.sortRepos.onchange = () => this.sortRepositories();
        this.renderRecentSearches();
    }

    handleSearch() {
        const username = this.searchInput.value.trim();

        if (!username) return this.showError("Please enter a valid username");

        this.saveRecentSearch(username);
        this.getProfile(username);
        this.searchInput.value = "";
    }

    async getProfile(username) {
        this.showLoading();

        try {
            const [userRes, repoRes] = await Promise.all([
                fetch(`https://api.github.com/users/${username}`),
                fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
            ]);

            if (userRes.status === 403 || repoRes.status === 403) {
                const targetRes = userRes.status === 403 ? userRes : repoRes;
                const resetUnix = targetRes.headers.get("X-RateLimit-Reset");
                const resetTime = new Date(resetUnix * 1000);
                throw new Error(`GitHub rate limit exceeded. Try again at ${resetTime.toLocaleTimeString()}`);
            }

            if (!userRes.ok) throw new Error("User not found");
            if (!repoRes.ok) throw new Error("Could not fetch repositories");

            const user = await userRes.json();
            this.repos = await repoRes.json();

            this.renderProfile(user);
            this.renderLanguageBreakdown(this.repos);
            this.sortRepositories();
        } catch (err) {
            this.profileContainer.classList.add("hidden");
            this.showError(err.message);
        }

        this.hideLoading();
    }

    renderProfile(user) {
        this.errorMsg.textContent = "";

        const set = (id, value) =>
            document.getElementById(id).textContent = value;

        document.getElementById("avatar").src = user.avatar_url;

        set("fullName", user.name || user.login);
        set("userName", `@${user.login}`);
        set("bio", user.bio || "No bio available");
        set("repoCount", user.public_repos);
        set("followerCount", user.followers);
        set("followingCount", user.following);
        set("activeDays", this.calculateActiveDays(user.created_at));
        set("location", user.location || "Not Available");
        set("company", user.company || "Not Available");
        set("joinDate", this.formatDate(user.created_at));

        const blog = document.getElementById("blogLink");

        if (user.blog) {
            blog.textContent = user.blog;
            blog.href = user.blog.startsWith("http") ? user.blog : `https://${user.blog}`;
        } else {
            blog.textContent = "Not Available";
            blog.removeAttribute("href");
        }

        document.getElementById("profileLink").href = user.html_url;
        this.profileContainer.classList.remove("hidden");
    }

    renderLanguageBreakdown(repos) {
        const map = {};

        repos.forEach(repo => {
            if (repo.language)
                map[repo.language] = (map[repo.language] || 0) + 1;
        });

        const total = Object.values(map).reduce((a, b) => a + b, 0);

        this.languageSummary.innerHTML = "";

        Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .forEach(([lang, count]) => {
                this.languageSummary.innerHTML += `
                    <div class="langChip">
                        ${lang} ${(count / total * 100).toFixed(1)}%
                    </div>
                `;
            });
    }

    sortRepositories() {
        const repos = [...this.repos];
        const type = this.sortRepos.value;

        if (type === "stars")
            repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

        if (type === "name")
            repos.sort((a, b) => a.name.localeCompare(b.name));

        if (type === "updated")
            repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        this.renderRepositories(repos);
    }

    renderRepositories(repos) {
        if (!repos.length) {
            this.repoContainer.innerHTML = `<p class="emptyRepo">No repositories found.</p>`;
            return;
        }

        this.repoContainer.innerHTML = repos.map(repo => `
            <div class="repoCard">
                <h4>
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                </h4>
                <p>${repo.description || "No description available"}</p>
                <div class="repoMeta">
                    <span>💻 ${repo.language || "Unknown"}</span>
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    <span>Updated: ${this.formatDate(repo.updated_at)}</span>
                </div>
            </div>
        `).join("");
    }

    saveRecentSearch(username) {
        let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];

        searches = [username, ...searches]
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .slice(0, 5);

        localStorage.setItem("recentSearches", JSON.stringify(searches));
        this.renderRecentSearches();
    }

    renderRecentSearches() {
        const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
        this.recentSearches.innerHTML = "";

        searches.forEach(username => {
            const btn = document.createElement("button");
            btn.textContent = username;
            btn.onclick = () => {
                this.searchInput.value = username;
                this.handleSearch();
            };
            this.recentSearches.appendChild(btn);
        });
    }

    calculateActiveDays(date) {
        return Math.floor((Date.now() - new Date(date)) / 86400000);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    showLoading() {
        this.skeleton.classList.remove("hidden");
        this.profileContainer.classList.add("hidden");
        this.errorMsg.textContent = "";
    }

    hideLoading() {
        this.skeleton.classList.add("hidden");
    }

    showError(msg) {
        this.errorMsg.textContent = msg;
        setTimeout(() => this.errorMsg.textContent = "", 5000);
    }
}

document.addEventListener("DOMContentLoaded", () => new GithubProfileFinder());
