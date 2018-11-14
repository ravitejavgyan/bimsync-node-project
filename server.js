var express = require('express');
const app = require('express')();




//This method suggests that index will load file login.ejs in views folder.
app.get('/', (req, res) => {
	res.send('login');
});




app.listen(4000, () => console.log(`Express server running on port 4000`));