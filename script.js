class GithubProfileFinder {
    constructor() {
        this.searchBtn = document.getElementById("searchBtn");
        this.searchInput = document.getElementById("searchInput");
        this.skeleton = document.getElementById("skeleton");
        this.profileContainer = document.getElementById("profileContainer");
        this.errorMsg = document.getElementById("errorMsg");

        this.addEvents();
    }

    addEvents() {
        this.searchBtn.addEventListener("click", () => {
            this.handleSearch();
        });

        this.searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                this.handleSearch();
            }
        });
    }

    handleSearch() {
        let usernameValue = this.searchInput.value.trim();

        if (usernameValue.length === 0) {
            this.showError("Please enter a valid username");
            return;
        }

        this.getProfile(usernameValue);
        this.searchInput.value = "";
    }

    async getProfile(usernameValue) {
        this.showLoading();

        try {
            let response = await fetch(`https://api.github.com/users/${usernameValue}`);

            if (!response.ok) {
                throw new Error("User not found");
            }

            let userData = await response.json();
            this.renderProfile(userData);

        } catch (error) {
            this.hideLoading();
            this.profileContainer.classList.add("hidden");
            this.showError("User not found. Please check the username and try again.");
        }
    }

    renderProfile(userData) {
        this.hideLoading();
        this.errorMsg.textContent = "";

        let avatar = document.getElementById("avatar");
        let fullName = document.getElementById("fullName");
        let userName = document.getElementById("userName");
        let bio = document.getElementById("bio");
        let repoCount = document.getElementById("repoCount");
        let followerCount = document.getElementById("followerCount");
        let followingCount = document.getElementById("followingCount");
        let activeDays = document.getElementById("activeDays");
        let location = document.getElementById("location");
        let company = document.getElementById("company");
        let blogLink = document.getElementById("blogLink");
        let joinDate = document.getElementById("joinDate");
        let profileLink = document.getElementById("profileLink");

        avatar.src = userData.avatar_url;
        fullName.textContent = userData.name || userData.login;
        userName.textContent = "@" + userData.login;
        bio.textContent = userData.bio || "No bio available";

        repoCount.textContent = userData.public_repos;
        followerCount.textContent = userData.followers;
        followingCount.textContent = userData.following;
        activeDays.textContent = this.calculateActiveDays(userData.created_at);

        location.textContent = userData.location || "Not Available";
        company.textContent = userData.company || "Not Available";

        if (userData.blog) {
            blogLink.textContent = userData.blog;
            blogLink.href = userData.blog.startsWith("http") ? userData.blog : `https://${userData.blog}`;
        } else {
            blogLink.textContent = "Not Available";
            blogLink.removeAttribute("href");
        }

        joinDate.textContent = this.formatDate(userData.created_at);
        profileLink.href = userData.html_url;

        this.profileContainer.classList.remove("hidden");
    }

    calculateActiveDays(createdAt) {
        let createdDate = new Date(createdAt);
        let today = new Date();
        let differenceInMs = today - createdDate;
        let differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
        return differenceInDays;
    }

    formatDate(dateString) {
        let options = { year: "numeric", month: "long", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    }

    showLoading() {
        this.skeleton.classList.remove("hidden");
        this.profileContainer.classList.add("hidden");
        this.errorMsg.textContent = "";
    }

    hideLoading() {
        this.skeleton.classList.add("hidden");
    }

    showError(message) {
        this.errorMsg.textContent = message;
        setTimeout(() => {
            this.errorMsg.textContent = "";
        }, 4000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new GithubProfileFinder();
});