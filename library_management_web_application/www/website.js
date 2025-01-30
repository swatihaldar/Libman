// Function to handle editing a row
function handleEditRow(button) {
    // console.log(button)
    const row = button.closest('tr');
    Array.from(row.cells).forEach((cell, index) => {
        console.log(index)
        if (index < row.cells.length - 1) {
            const originalText = cell.textContent;
            cell.innerHTML = `<input type="text" name="field${index}" value="${originalText}" />`;
        }
    });
    row.cells[row.cells.length - 1].innerHTML = `
        <button class="saveBtn">Save</button>
        <button class="cancelBtn">Cancel</button>
    `;

    row.querySelector(".saveBtn").addEventListener("click", function () {
        handleSaveEdit(this);
    });
    row.querySelector(".cancelBtn").addEventListener("click", function () {
        handleCancelEdit(this);
    });
}
// Function to handle saving edits
function handleSaveEdit(button) {
    const row = button.closest('tr');
    console.log(row, "ROWWWWW")
    const table = button.closest('table');


    const thead = table.querySelector('thead tr');
    console.log(thead, "ASDF")

    // Extract column names 
    const columnNames = Array.from(thead.cells).map(cell => cell.getAttribute("name"));
    console.log(columnNames, "Colum")


    // Gather updated data
    const inputs = Array.from(row.querySelectorAll('input'));
    const data = {};


    inputs.forEach((input, index) => {
        const columnName = columnNames[index];

        if (columnName) {
            data[columnName] = input.value;
        }
    });

    console.log(data, "Mapped Data");
    row.cells[row.cells.length - 1].innerHTML = `
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
    `;

    // Determine DocType
    const doctype = table.id === 'bookTable' ? 'Books' : 'Members';
    const name = row.cells[0].querySelector("input").value; 
    console.log(name, "Mayuri")
    // console.log(row.,"ROW")

    fetch(`/api/v2/document/${doctype}/${name}`, {

        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `token 16cf5940b269f4e:ae6c12a8ecc806f` 
        },
        body: JSON.stringify(data)
    })
        .then(response =>


            response.json())
        .then(result => {
            if (result.data) {
                alert(`${doctype} updated successfully!`);
                location.reload(); 
            } else {
                alert('Failed to update the document.');
            }
        })
        .catch(error =>
            console.error('Error:', error)
        )
}

// Function to handle canceling edit
function handleCancelEdit(button) {
    const row = button.closest('tr');
    const inputs = row.querySelectorAll('input');

    
    inputs.forEach((input, index) => {
        row.cells[index].innerText = input.defaultValue;
    });

    row.cells[row.cells.length - 1].innerHTML = `
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
    `;

    // Reattach event listeners to buttons
    row.querySelector(".editBtn").addEventListener("click", function () {
        handleEditRow(this);
    });
    row.querySelector(".deleteBtn").addEventListener("click", function () {
        handleDeleteRow(this);
    });
}

// Function to handle deleting a row
function handleDeleteRow(button) {
    const row = button.closest('tr');
    const doctype = button.closest('table').id === 'bookTable' ? 'Books' : 'Members';
    const name = row.cells[0].textContent.trim(); 
    console.log(name, "Document Name to Delete");

    // Confirm deletion
    if (confirm(`Are you sure you want to delete this ${doctype}?`)) {
        
        fetch(`/api/v2/document/${doctype}/${name}`,{
            method: 'DELETE',
            headers: {
                'Authorization': `token 16cf5940b269f4e:ae6c12a8ecc806f` 
            }
        })
            .then(response => {
                console.log(response, "Response")
                if (response.ok) {
                    alert(`${doctype} "${name}" has been successfully deleted.`);
                    row.remove(); 
                } else {
                    return response.json();
                }
            })
            .then(result => {
                console.log(result,"result")
                if (result?.errors?.length) {
                    alert(`Error: ${result.errors[0].message}`);
                }
            })
            .catch(error => {
                
                console.error('Error:', error)
            });
    }
}

document.querySelectorAll("#bookTable .editBtn, #memberTable .editBtn").forEach(button => {
    button.addEventListener("click", function () {
        handleEditRow(this);
    });
});

document.querySelectorAll("#bookTable .deleteBtn, #memberTable .deleteBtn").forEach(button => {
    button.addEventListener("click", function () {
        handleDeleteRow(this);
    });
});


async function searchItems() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

    
    const tableRows = document.querySelectorAll('#bookTable tbody tr');

    
    tableRows.forEach(row => {
        row.style.backgroundColor = ''; 
    });

    if (!searchInput) {
        return; // Exit if  empty
    }

    try {
        let found = false;
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td'); //nodelist
            console.log(cells, "Cells");
            const rowContent = Array.from(cells).map(cell => cell.textContent.toLowerCase());

            // console.log('Row content:', rowContent); 

            // Check if  cell contains the search input
            if (rowContent.some(content => content.includes(searchInput))) {
                row.style.backgroundColor = 'rgba(173, 216, 230, 1)'; 
                found = true;
            }
        });

        if (!found) {
            alert(`No results found for "${searchInput}".`);
        }
    } catch (error) {
        console.error('Error searching and highlighting rows:', error);
    }
}



// Function to mark the transaction as returned
function markReturn(btn, transactionId) {
    console.log("Button clicked:", btn);
    console.log("Transaction ID Passed:", transactionId);

    
    const row = btn.closest('tr');

    
    if (!transactionId) {
        alert("Transaction ID is missing!");
        console.error("Transaction ID is missing!");
        return;
    }

    // Confirm action
    if (!confirm(`Are you sure you want to mark Transaction ID ${transactionId} as Returned?`)) {
        return;
    }

    

    // Make the API call
    fetch(`/api/v2/document/Transactions/${transactionId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `token 16cf5940b269f4e:ae6c12a8ecc806f`, 
        },
        body: JSON.stringify({
            status: "Returned", 
        }),
    })
        .then((res) => {
            console.log("Raw Response:", res);
            return res.json();
        })
        .then((result) => {
            console.log("Parsed Response:", result);

            if (result.data) {
                alert(`Transaction ID ${transactionId} marked as Returned successfully!`);
                
                row.remove(); 
            } else {
                alert("Failed to update the transaction.");
                console.error("API returned an error:", result);
            }
        })
        .catch((err) => {
            console.error("Fetch Error:", err);
            alert("An error occurred while marking the transaction as Returned.");
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn-return');
    buttons.forEach((button) => {
        const transactionId = button.closest('tr').querySelector('td:nth-child(1)').textContent.trim(); 
        button.setAttribute('onclick', `markReturn(this, '${transactionId}')`);
    });
});


//Import
document.getElementById("importBooksBtn").addEventListener("click", importBooks);

async function importBooks() {
    try {
        console.log("Import Books button clicked!");
        
        // Fetch data from the external API
        const response = await fetch("https://frappe.io/api/method/frappe-library?page=2", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Books data fetched:", data);
        
        if (data.message && data.message.length > 0) {
            for (const book of data.message) {
                const bookData = {
                    title: book.title,
                    book_id: book.bookID,
                    number_of_pages: book.  num_pages,
                    author: book.authors,
                    isbn: book.isbn,
                    publisher: book.publisher,
                    stock_quantity: 20
                };
                
                // Push book data to your Books Doctype
                const result = await createBookInDoctype(bookData);
                console.log("Book created:", result);
            }
        } else {
            console.log("No books found in the response.");
        }
    } catch (error) {
        console.error("Error while importing books:", error);
    }
}

async function createBookInDoctype(bookData) {
    try {
        const response = await fetch("/api/v2/document/Books", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `token 16cf5940b269f4e:ae6c12a8ecc806f`, 
            },
            body: JSON.stringify(bookData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create book: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error creating book in Doctype:", error);
    }
}



document.addEventListener("DOMContentLoaded", function() {
    
    const tabs = document.querySelectorAll(".tabs button");
    
    
    const bookSection = document.querySelector(".section#bookList");
    const memberSection = document.querySelector(".section#memberList");
    const issuedBooksSection = document.querySelector(".section#issuedBooks");
    const returnBooksSection = document.querySelector(".section#returnBooks");

    function handleTabClick(event) {
        const tabText = event.target.innerText.toLowerCase();

        //hide sections
        bookSection.style.display = "none";
        memberSection.style.display = "none";
        issuedBooksSection.style.display = "none";
        returnBooksSection.style.display = "none";

        
        if (tabText === "books") {
            bookSection.style.display = "block";
        } else if (tabText === "members") {
            memberSection.style.display = "block";
        } else if (tabText === "transactions") {
            issuedBooksSection.style.display = "block";
            returnBooksSection.style.display = "block";
        } else {
            // For "All" tab
            bookSection.style.display = "block";
            memberSection.style.display = "block";
            issuedBooksSection.style.display = "block";
            returnBooksSection.style.display = "block";
        }

        tabs.forEach(tab => tab.classList.remove("active"));
        event.target.classList.add("active");
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", handleTabClick);
    });

    tabs[0].click();
});  