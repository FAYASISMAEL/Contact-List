const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient("mongodb://127.0.0.1:27017");
const dbName = "contacts";

const htmlPath = path.join(__dirname, "index.html");
const cssPath = path.join(__dirname, "styles.css");
const scriptPath = path.join(__dirname, "script.js");
const addPath = path.join(__dirname, "add", "add.html");
const addPathCss = path.join(__dirname, "add", "add.css");
const editPath = path.join(__dirname, "edit", "edit.html");
const editPathCss = path.join(__dirname, "edit", "edit.css");

server = http.createServer(async (req, res) => {
  console.log(req.url);

  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("data");

  const parsedUrl = url.parse(req.url, true);

  if (req.method === "GET") {
    if (req.url === "/") {
      fs.readFile(htmlPath, (error, data) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
    } else if (req.url === "/contacts") {
      let contacts = await collection.find({}).toArray();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(contacts));
    } else if (req.url === "/styles.css") {
      fs.readFile(cssPath, (error, data) => {
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(data);
      });
    } else if (req.url === "/script.js") {
      fs.readFile(scriptPath, (error, data) => {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(data);
      });
    } else if (req.url === "/add/add.html") {
      fs.readFile(addPath, (error, data) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
    } else if (req.url === "/add/add.css") {
      fs.readFile(addPathCss, (error, data) => {
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(data);
      });
    } else if (parsedUrl.pathname === "/edit.html") {
      console.log("Serving edit.html");
      fs.readFile(editPath, (error, data) => {
        if (error) {
          res.writeHead(404);
          res.end("Edit page not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
    } else if (req.url === "/edit/edit.css") {
      fs.readFile(editPathCss, (error, data) => {
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(data);
      });
    }

    // ID section to take data
    else if (parsedUrl.pathname === "/get-contact") {
      try {
        const contactId = parsedUrl.query.id;
        if (!contactId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Contact ID is required" }));
          return;
        }

        const contact = await collection.findOne({
          _id: new ObjectId(contactId),
        });
        if (!contact) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Contact not found" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(contact));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error" }));
      }
    }
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      if (req.url === "/add-contact") {
        let parsed = JSON.parse(body);
        await collection.insertOne(parsed);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Contact added successfully" }));
      } else if (req.url === "/delete-contact") {
        let parsed = JSON.parse(body);
        await collection.deleteOne({ _id: new ObjectId(parsed.id) });
        res.writeHead(200);
        res.end("Selected contact deleted from the contact");
      }

      // contact updating section
      else if (req.url.startsWith("/edit.html")) {
        fs.readFile(editPath, (error, data) => {
          if (error) {
            res.writeHead(404);
            res.end("Page is not Found to Update Contact");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        });
      } else if (req.url === "/update-contact") {
        try {
          const parsed = JSON.parse(body);
          const { id, name, number } = parsed;

          if (!id || id.length !== 24) {
            console.error("Invalid Contact ID: ", id);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid Contact ID" }));
            return;
          }

          console.log(
            `Received update request for ID: ${id}, Name: ${name}, Number: ${number}`
          );

          const contact = await collection.findOne({ _id: new ObjectId(id) });
          if (!contact) {
            console.error("Contact not found for ID:", id);
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Contact not found" }));
            return;
          }

          const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, number } }
          );

          console.log("Update result:", result);

          if (result.modifiedCount === 0) {
            console.error("Contact not updated:", id);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Try Again..." }));
          } else {
            console.log("Contact updated successfully to:", name);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ message: "Contact updated successfully" })
            );
          }
        } catch (error) {
          console.error("Error to updateg Contact details:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Server error" }));
        }
      }
    });
  }
});

server.listen(3000, () => {
  console.log("Link to your Server => @http://localhost:3000");
});
