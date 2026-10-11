
const userlistdiv = document.getElementById("userlist");
const selectedusername = document.getElementById("selectedusername");
const selectedemail = document.getElementById("selectedemail");
const selecteduserid = document.getElementById("selecteduserid");
const postslistdiv = document.getElementById("postslist");
const albumslistdiv = document.getElementById("albumslist");
const todoslistdiv = document.getElementById("todoslist");
const message = document.getElementById("message");

let posts = [];
let comments = [];
let albums = [];
let todos = [];
let currentuserid = null;
let currentrequest = 0;

// Load users when the page opens.
document.addEventListener("DOMContentLoaded", getusers);

async function getusers() {
    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        if (!response.ok) {
            throw new Error("Could not load users.");
        }

        const data = await response.json();

        userlistdiv.innerHTML = data.map((user) => {
            return `
                <button class="useritem" data-userid="${user.id}">
                    <span>${user.name}</span>
                    <small>${user.email}</small>
                </button>
            `;
        }).join("");

        if (data.length > 0) {
            handleuserclick(data[0]);
        }
    } catch (error) {
        showmessage(error.message);
    }
}

// Select a user and load their posts, comments, albums and todos.
async function handleuserclick(user) {
    const requestid = ++currentrequest;

    currentuserid = user.id;

    selectedusername.textContent = user.name;
    selectedemail.textContent = user.email;
    selecteduserid.textContent = "User ID: " + user.id;

    document.querySelectorAll(".useritem").forEach((button) => {
        button.classList.toggle(
            "active",
            Number(button.dataset.userid) === user.id
        );
    });

    activatetab("posts");
    clearcontent();
    showmessage("Loading user data...", true);

    try {
        const [postsresponse, albumsresponse, todosresponse] =
            await Promise.all([
                fetch(
                    `https://jsonplaceholder.typicode.com/posts?userId=${user.id}`
                ),
                fetch(
                    `https://jsonplaceholder.typicode.com/albums?userId=${user.id}`
                ),
                fetch(
                    `https://jsonplaceholder.typicode.com/todos?userId=${user.id}`
                )
            ]);

        if (
            !postsresponse.ok ||
            !albumsresponse.ok ||
            !todosresponse.ok
        ) {
            throw new Error("Could not load user data.");
        }

        const [postsdata, albumsdata, todosdata] = await Promise.all([
            postsresponse.json(),
            albumsresponse.json(),
            todosresponse.json()
        ]);

        const commentresponses = await Promise.all(
            postsdata.map((post) => {
                return fetch(
                    `https://jsonplaceholder.typicode.com/comments?postId=${post.id}`
                );
            })
        );

        if (commentresponses.some((response) => !response.ok)) {
            throw new Error("Could not load comments.");
        }

        const commentsdata = await Promise.all(
            commentresponses.map((response) => {
                return response.json();
            })
        );

        // Ignore results if another user was selected meanwhile.
        if (requestid !== currentrequest) {
            return;
        }

        posts = postsdata;

        // Combine all comment arrays into one array without using flat().
        comments = [];

        for (let i = 0; i < commentsdata.length; i++) {
            for (let j = 0; j < commentsdata[i].length; j++) {
                comments.push(commentsdata[i][j]);
            }
        }

        albums = albumsdata;
        todos = todosdata.filter((todo) => !todo.completed);

        renderposts();
        renderalbums();
        rendertodos();

        showmessage("");
    } catch (error) {
        if (requestid === currentrequest) {
            showmessage(error.message);
        }
    }
}

// Show posts and each post's own comments.
function renderposts() {
    document.getElementById("postcount").textContent =
        `(${posts.length})`;

    postslistdiv.innerHTML = posts.map((post) => {
        const postcomments = comments.filter((comment) => {
            return comment.postId === post.id;
        });

        return `
            <article class="post-card">
                <h3>${post.title}</h3>

                <p class="post-body">
                    ${post.body}
                </p>

                <div class="comments-section">
                    <h4>Comments (${postcomments.length})</h4>

                    ${postcomments.map((comment) => {
                        return `
                            <div class="comment">
                                <strong>${comment.name}</strong>
                                <small>${comment.email}</small>
                                <p>${comment.body}</p>
                            </div>
                        `;
                    }).join("")}
                </div>
            </article>
        `;
    }).join("");
}

// Show only the selected user's album names.
function renderalbums() {
    albumslistdiv.innerHTML = `
        <h2 class="section-title">Albums (${albums.length})</h2>

        <div class="album-list">
            ${albums.map((album) => {
                return `
                    <button class="album-button" data-albumid="${album.id}">
                        <span class="album-icon">${album.id}</span>

                        <span class="album-info">
                            <strong>${album.title}</strong>
                            <small>Click to view photos</small>
                        </span>

                        <span class="album-arrow">&rarr;</span>
                    </button>
                `;
            }).join("")}
        </div>
    `;
}

// Open an album and fetch only its photos.
async function handlealbumclick(albumid) {
    const album = albums.find((item) => item.id === albumid);

    if (!album) {
        return;
    }

    const requestid = ++currentrequest;

    showmessage("Loading photos...", true);

    try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/photos?albumId=${albumid}`
        );

        if (!response.ok) {
            throw new Error("Could not load album photos.");
        }

        const photos = await response.json();

        if (requestid !== currentrequest) {
            return;
        }

        albumslistdiv.innerHTML = `
            <button class="back-button" id="backtoalbums">
                &larr; Back to albums
            </button>

            <h2 class="section-title">${album.title}</h2>

            <p class="muted">Photos in this album: ${photos.length}</p>

            <div class="photo-grid">
                ${photos.map((photo) => {
                    return `
                        <article class="photo-card">
                            <img
                                src="${photo.thumbnailUrl}"
                                alt="${photo.title}"
                                width="100"
                                height="100"
                                loading="lazy"
                            >
                            <p>${photo.title}</p>
                        </article>
                    `;
                }).join("")}
            </div>
        `;

        showmessage("");
    } catch (error) {
        if (requestid === currentrequest) {
            showmessage(error.message);
        }
    }
}

// Show only the remaining tasks.
function rendertodos() {
    document.getElementById("todocount").textContent = todos.length;
    document.getElementById("pendingcount").textContent =
        `(${todos.length})`;

    if (todos.length === 0) {
        todoslistdiv.innerHTML = `
            <p class="empty-state">All tasks are completed.</p>
        `;
        return;
    }

    todoslistdiv.innerHTML = todos.map((todo) => {
        return `
            <label class="todo-card">
                <input
                    type="checkbox"
                    data-todoid="${todo.id}"
                >
                <span>${todo.title}</span>
            </label>
        `;
    }).join("");
}

// Remove a task from the pending list when checked.
function handletodoclick(todoid) {
    todos = todos.filter((todo) => todo.id !== todoid);
    rendertodos();
}

// Switch between Posts, Albums and Todos.
function activatetab(tabname) {
    document.querySelectorAll(".tab").forEach((button) => {
        button.classList.toggle(
            "active-tab",
            button.dataset.tab === tabname
        );
    });

    document.querySelectorAll(".tab-content").forEach((section) => {
        section.classList.toggle(
            "hidden",
            section.id !== `${tabname}view`
        );
    });
}

// Clear old content when selecting another user.
function clearcontent() {
    posts = [];
    comments = [];
    albums = [];
    todos = [];

    postslistdiv.innerHTML = "";
    albumslistdiv.innerHTML = "";
    todoslistdiv.innerHTML = "";

    document.getElementById("postcount").textContent = "(0)";
    document.getElementById("todocount").textContent = "0";
    document.getElementById("pendingcount").textContent = "(0)";
}

// Display loading messages and errors.
function showmessage(text, loading = false) {
    message.textContent = text;
    message.classList.toggle("loading-message", loading);
}

// Handle clicks using event delegation.
document.addEventListener("click", (event) => {
    const userbutton = event.target.closest(".useritem");

    if (userbutton) {
        const userid = Number(userbutton.dataset.userid);

        // Find the user's data from the list.
        fetch(`https://jsonplaceholder.typicode.com/users/${userid}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Could not load selected user.");
                }

                return response.json();
            })
            .then((user) => handleuserclick(user))
            .catch((error) => showmessage(error.message));

        return;
    }

    const tabbutton = event.target.closest(".tab");

    if (tabbutton) {
        // Invalidate any unfinished album request.
        currentrequest++;

        activatetab(tabbutton.dataset.tab);
        showmessage("");
        return;
    }

    const albumbutton = event.target.closest(".album-button");

    if (albumbutton) {
        handlealbumclick(Number(albumbutton.dataset.albumid));
        return;
    }

    if (event.target.closest("#backtoalbums")) {
        // Invalidate any unfinished album request.
        currentrequest++;

        renderalbums();
        showmessage("");
    }
});

// Handle todo checklist changes.
document.addEventListener("change", (event) => {
    if (event.target.matches(".todo-card input[type='checkbox']")) {
        handletodoclick(Number(event.target.dataset.todoid));
    }
});
