
const userlistdiv = document.getElementById("userlist");
const selectedusername = document.getElementById("selectedusername");
const selectedemail = document.getElementById("selectedemail");
const selecteduserid = document.getElementById("selecteduserid");
const postslistdiv = document.getElementById("postslist");
const albumslistdiv = document.getElementById("albumslist");
const todoslistdiv = document.getElementById("todoslist");
const message = document.getElementById("message");

let users = [];
let posts = [];
let comments = [];
let albums = [];
let todos = [];

let currentuserid = null;
let userrequest = 0;
let albumrequest = 0;

// Load users when the page opens.
document.addEventListener("DOMContentLoaded", getusers);


// Get all users from the API.
async function getusers() {
    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        if (!response.ok) {
            throw new Error("Could not load users.");
        }

        users = await response.json();

        userlistdiv.innerHTML = "";

        // Create a button for each user.
        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            userlistdiv.innerHTML += `
                <button class="useritem" data-userid="${user.id}">
                    <span>${user.name}</span>
                    <small>${user.email}</small>
                </button>
            `;
        }

        // Automatically select the first user.
        if (users.length > 0) {
            handleuserclick(users[0]);
        }
    } catch (error) {
        showmessage(error.message);
    }
}


// Select a user and load their data.
async function handleuserclick(user) {
    const requestid = ++userrequest;

    // Cancel any unfinished album request.
    albumrequest++;

    currentuserid = user.id;

    selectedusername.textContent = user.name;
    selectedemail.textContent = user.email;
    selecteduserid.textContent = "User ID: " + user.id;

    // Highlight the selected user.
    const userbuttons = document.querySelectorAll(".useritem");

    for (let i = 0; i < userbuttons.length; i++) {
        const button = userbuttons[i];

        if (Number(button.dataset.userid) === user.id) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    }

    activatetab("posts");
    clearcontent();
    showmessage("Loading user data...", true);

    try {
        // Load the user's posts.
        const postsresponse = await fetch(
            `https://jsonplaceholder.typicode.com/posts?userId=${user.id}`
        );

        if (!postsresponse.ok) {
            throw new Error("Could not load posts.");
        }

        const postsdata = await postsresponse.json();

        // Load the user's albums.
        const albumsresponse = await fetch(
            `https://jsonplaceholder.typicode.com/albums?userId=${user.id}`
        );

        if (!albumsresponse.ok) {
            throw new Error("Could not load albums.");
        }

        const albumsdata = await albumsresponse.json();

        // Load the user's todos.
        const todosresponse = await fetch(
            `https://jsonplaceholder.typicode.com/todos?userId=${user.id}`
        );

        if (!todosresponse.ok) {
            throw new Error("Could not load todos.");
        }

        const todosdata = await todosresponse.json();

        // Load comments for every post.
        const commentsdata = [];

        for (let i = 0; i < postsdata.length; i++) {
            const post = postsdata[i];

            const commentresponse = await fetch(
                `https://jsonplaceholder.typicode.com/comments?postId=${post.id}`
            );

            if (!commentresponse.ok) {
                throw new Error("Could not load comments.");
            }

            const postcomments = await commentresponse.json();

            // Add each comment to one large comments array.
            for (let j = 0; j < postcomments.length; j++) {
                commentsdata.push(postcomments[j]);
            }
        }

        // Ignore results if another user was selected.
        if (requestid !== userrequest) {
            return;
        }

        posts = postsdata;
        comments = commentsdata;
        albums = albumsdata;

        // Keep only pending todos.
        todos = [];

        for (let i = 0; i < todosdata.length; i++) {
            if (todosdata[i].completed === false) {
                todos.push(todosdata[i]);
            }
        }

        renderposts();
        renderalbums();
        rendertodos();

        showmessage("");
    } catch (error) {
        if (requestid === userrequest) {
            showmessage(error.message);
        }
    }
}


// Display posts and their comments.
function renderposts() {
    document.getElementById("postcount").textContent =
        "(" + posts.length + ")";

    postslistdiv.innerHTML = "";

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];

        let postcomments = [];

        // Find comments belonging to this post.
        for (let j = 0; j < comments.length; j++) {
            if (comments[j].postId === post.id) {
                postcomments.push(comments[j]);
            }
        }

        let commentshtml = "";

        // Create the HTML for each comment.
        for (let j = 0; j < postcomments.length; j++) {
            const comment = postcomments[j];

            commentshtml += `
                <div class="comment">
                    <strong>${comment.name}</strong>
                    <small>${comment.email}</small>
                    <p>${comment.body}</p>
                </div>
            `;
        }

        // Create the post and its comments.
        postslistdiv.innerHTML += `
            <article class="post-card">
                <h3>${post.title}</h3>

                <p class="post-body">
                    ${post.body}
                </p>

                <div class="comments-section">
                    <h4>Comments (${postcomments.length})</h4>

                    ${commentshtml}
                </div>
            </article>
        `;
    }
}


// Display the user's albums.
function renderalbums() {
    albumslistdiv.innerHTML = "";

    let albumhtml = `
        <h2 class="section-title">Albums (${albums.length})</h2>
        <div class="album-list">
    `;

    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];

        albumhtml += `
            <button class="album-button" data-albumid="${album.id}">
                <span class="album-icon">${album.id}</span>

                <span class="album-info">
                    <strong>${album.title}</strong>
                    <small>Click to view photos</small>
                </span>

                <span class="album-arrow">&rarr;</span>
            </button>
        `;
    }

    albumhtml += "</div>";

    albumslistdiv.innerHTML = albumhtml;
}


// Open an album and load its photos.
async function handlealbumclick(albumid) {
    let selectedalbum = null;

    // Find the selected album.
    for (let i = 0; i < albums.length; i++) {
        if (albums[i].id === albumid) {
            selectedalbum = albums[i];
            break;
        }
    }

    if (selectedalbum === null) {
        return;
    }

    const requestid = ++albumrequest;

    showmessage("Loading photos...", true);

    try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/photos?albumId=${albumid}`
        );

        if (!response.ok) {
            throw new Error("Could not load album photos.");
        }

        const photos = await response.json();

        // Ignore the result if another album or user was selected.
        if (requestid !== albumrequest) {
            return;
        }

        let photoshtml = "";

        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];

            photoshtml += `
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
        }

        albumslistdiv.innerHTML = `
            <button class="back-button" id="backtoalbums">
                &larr; Back to albums
            </button>

            <h2 class="section-title">${selectedalbum.title}</h2>

            <p class="muted">Photos in this album: ${photos.length}</p>

            <div class="photo-grid">
                ${photoshtml}
            </div>
        `;

        showmessage("");
    } catch (error) {
        if (requestid === albumrequest) {
            showmessage(error.message);
        }
    }
}


// Display pending todos.
function rendertodos() {
    document.getElementById("todocount").textContent = todos.length;

    document.getElementById("pendingcount").textContent =
        "(" + todos.length + ")";

    todoslistdiv.innerHTML = "";

    if (todos.length === 0) {
        todoslistdiv.innerHTML = `
            <p class="empty-state">All tasks are completed.</p>
        `;

        return;
    }

    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];

        todoslistdiv.innerHTML += `
            <label class="todo-card">
                <input
                    type="checkbox"
                    data-todoid="${todo.id}"
                >

                <span>${todo.title}</span>
            </label>
        `;
    }
}


// Remove a completed task from the pending list.
function handletodoclick(todoid) {
    const remainingtodos = [];

    for (let i = 0; i < todos.length; i++) {
        if (todos[i].id !== todoid) {
            remainingtodos.push(todos[i]);
        }
    }

    todos = remainingtodos;

    rendertodos();
}


// Switch between the three tabs.
function activatetab(tabname) {
    const tabbuttons = document.querySelectorAll(".tab");

    for (let i = 0; i < tabbuttons.length; i++) {
        const button = tabbuttons[i];

        if (button.dataset.tab === tabname) {
            button.classList.add("active-tab");
        } else {
            button.classList.remove("active-tab");
        }
    }

    const sections = document.querySelectorAll(".tab-content");

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        if (section.id === tabname + "view") {
            section.classList.remove("hidden");
        } else {
            section.classList.add("hidden");
        }
    }
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


// Handle clicks on users, tabs, albums, and the back button.
document.addEventListener("click", function (event) {
    // Check whether a user button was clicked.
    const userbutton = event.target.closest(".useritem");

    if (userbutton) {
        const userid = Number(userbutton.dataset.userid);

        // Find the selected user in the users array.
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === userid) {
                handleuserclick(users[i]);
                break;
            }
        }

        return;
    }

    // Check whether a tab was clicked.
    const tabbutton = event.target.closest(".tab");

    if (tabbutton) {
        albumrequest++;

        activatetab(tabbutton.dataset.tab);
        showmessage("");

        return;
    }

    // Check whether an album was clicked.
    const albumbutton = event.target.closest(".album-button");

    if (albumbutton) {
        handlealbumclick(Number(albumbutton.dataset.albumid));
        return;
    }

    // Check whether the back button was clicked.
    const backbutton = event.target.closest("#backtoalbums");

    if (backbutton) {
        albumrequest++;

        renderalbums();
        showmessage("");
    }
});


// Handle todo checkbox changes.
document.addEventListener("change", function (event) {
    if (event.target.matches(".todo-card input[type='checkbox']")) {
        const todoid = Number(event.target.dataset.todoid);

        handletodoclick(todoid);
    }
});
