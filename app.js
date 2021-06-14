//jshint esversion:6

//-----------------------------------ACQUIRE PACKAGES------------------------------------------
const express = require("express");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs'); //all ejs files inside views
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));  //include all static files inside public dir(css)

//-------------------------CONNECT TO DB & CREATE COLLECTIONS-------------------------------------

//connect to mongodb atlas (cloud service)
mongoose.connect("mongodb+srv://ribhu-mukherjee:babu2309@cluster0.ugz2c.mongodb.net/todolistDB", { useNewUrlParser: true });

//Create Items collection
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

//add 3 item documents in Items collection(default)
const item1 = new Item({
  name: "Welcome to your Custom Todo List"
});

const item2 = new Item({
  name: "Hit the + to add an item"
});

const item3 = new Item({
  name: "Click the checkbox to delete an item"
});

const defaultItems = [item1, item2, item3];

//Creating the Lists collection
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

//---------------------------------------------GET AND POST CALLS---------------------------------------

//-------------------GET, POST, DELETE IN HOME ROOT-------------------------------------------------

//Used to render the home page
app.get("/", function (req, res) {

  const day = date.getDate();

  //select all from Items collection, returns an array
  Item.find({}, function (err, foundItems) {

    if (foundItems.length == 0) {

      //insert defaultItems array
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved items in database");
        }
      });
      res.redirect("/");
    }
    else {
      //render in list.ejs
      res.render('list', { workTitle: day, newListItems: foundItems });
    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  //create the Item document
  const item = new Item({
    name: itemName
  });

  const day = date.getDate();
  //if in home root, save in db, render the home page
  if (listName === day) {
    item.save();
    res.redirect("/");
  }
  else {
    //find the list which matches with the listName and add item into its array
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName); //render custom page
    })
  }


})

//---------------------------WHEN USER CLICKS THE CHECK BOX-------------------------------------------
app.post("/delete", function (req, res) {

  const checkedItemid = req.body.checkbox;
  const listName = req.body.listName;

  const day = date.getDate();
  //in home root
  if (listName === day) {

    Item.findByIdAndRemove(checkedItemid, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted the item");
        res.redirect("/");
      }
    });

  } else {
    //in custom root
    //find the list with name as listName, and delete the item with _id
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemid } } },
      function (err, foundList) {

        //redirect to the custom root to render it
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    )
  };
})

//----------------------------------------CUSTOM LISTS------------------------------------------
app.get("/:customListName", function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  //find the list with name as customListName, if not found: create, and render
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new List
        const list = new List({
          name: customListName,
          items: []
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        //Show an exisiting list
        res.render('list', { workTitle: foundList.name, newListItems: foundList.items });
      }
    }
    else {
      console.log("error has occured");
    }
  });
})

//When someone types in the custom text box
app.post("/custom", function(req,res){

  const listName = req.body.desiredList;

  const day = date.getDate();
  res.redirect("/" + listName);
})

//----------------------------------LISTEN AT PORT 3000----------------------------------------
app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
