/**
 * Created by Xaz on 3/2/2016.
 */

/*
 Author: Chris Kirchner
 Organization: OSU
 Class: CS290 Web Development
 Assignment: Week 10 - Database Interactions and UI
 Date: 13Mar16
 Purpose: client-side code for serving fitness track table-form to client
 */

//makes xmlhttprequest using mysql query 'operation' and 'callback' for client manipulation
function makeXMLHttpRequest(operation, callback){
    return function(data){
        var method;
        var path;
        if (operation == "SELECT"){
            method = "GET";
            path = 'get-fitness';
        }
        else if (operation == "INSERT"){
            method = "POST";
            path = 'insert-fitness';
        }
        else if (operation == "DELETE"){
            method = "POST";
            path = 'delete-fitness';
        }
        else if (operation == "UPDATE"){
            method = "POST";
            path = 'update-fitness';
        }
        var request = new XMLHttpRequest();
        //hard set IP?
        request.open(method, 'http://52.10.35.103:3002/'+path, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.addEventListener('load', function(){
            if (request.status >= 200 && request.status < 400){
                var response = JSON.parse(request.responseText);
                if (operation == 'INSERT'){
                    if (response['errno']){
                        //capture error states as null in callback
                        callback(null);
                    }
                    else {
                        callback(data, response.insertId);
                    }
                }
                else if (operation == 'SELECT'){
                    callback(response);
                }
                else if (operation == 'DELETE'){
                    callback();
                }
                else if (operation == 'UPDATE'){
                    if (response['errno']){
                        //capture error states as null in callback
                        callback(null);
                    }
                    else {
                        callback(data);
                    }
                }
            }
            else {
                console.log("Error in network request: ", request.statusText);
            }
        });
        //send data if posting
        if (method == 'POST'){
            request.send(JSON.stringify(data));
        }
        else {
            request.send();
        }
    }
}

//clears cell borders in tbody of table
function clearCells(tbody){
    for (var i=0; i<tbody.childNodes.length; i++){
        var tr = tbody.childNodes[i];
        if (tr.tagName == 'TR') {
            for (var j=0; j<tr.childNodes.length; j++) {
                var td = tr.childNodes[j];
                if (td.tagName == 'TD') {
                    td.style.border = '';
                }
            }
        }
    }
}

//renderTable does all table building and manipulation ass callback after xmlhttprequests
//accepts rows (when selecting data from server) and id of last row added
//id indicates new row is added
//yes, this function is too big and needs help
var renderTable = function(rows, id) {
    var table_id = 'fitness-data';
    var tbody = document.getElementById(table_id);
    //does stuff when new row added
    if (id) {
        rows['id'] = id;
        delete rows[""];
        rows = [rows];
        //clears values and borders after submitting row form
        var add_row = document.getElementById('add-fitness-row');
        for (var i=0; i<add_row.childNodes.length; i++){
            var elem = add_row.childNodes[i];
            if (elem.tagName == 'TD'){
                if (elem.childNodes[0].value != '+'){
                    elem.style.border = '';
                    elem.childNodes[0].value = '';
                }
            }
        }
    }
    //handles errors when data is not added to mysql
    //errors are shown as red border on cell
    if (rows == null) {
        var add_row = document.getElementById('add-fitness-row');
        for (var i=0; i<add_row.childNodes.length; i++){
            var elem = add_row.childNodes[i];
            if (elem.tagName == 'TD'){
                if (elem.childNodes[0].name == 'name'){
                    elem.style.border = '3px solid maroon';
                }
            }
        }
    }
    //if no errors, add stuff
    else {
        for (var r = 0; r < rows.length; r++) {
            var tr = document.createElement('tr');
            tbody.appendChild(tr);
            var row = rows[r];
            var original_row = JSON.parse(JSON.stringify(row));

            //create hidden update row element
            var update_row_id = document.createElement('input');
            update_row_id.type = 'hidden';
            update_row_id.id = row['id'];

            //hidden delete row element
            var delete_row_id = document.createElement('input');
            delete_row_id.type = 'hidden';
            delete_row_id.id = row['id'];

            //capture row id and form's select value
            var row_id = row['id'];
            delete row['id'];
            var select_value = row['lbs'];
            delete row['lbs'];

            //create form with row id
            var update_form = document.createElement('form');
            tr.appendChild(update_form);
            update_form.setAttribute('id', row_id);

            //fill text inputs
            //creates cells using list of names and types
            cells = [{'name': 'name', 'type': 'text'},
                {'name':'reps', 'type':'number'},
                {'name':'weight', 'type':'number'},
                {'name':'date', 'type':'date'}];
            for (var cell in cells) {
                var td = document.createElement('td');
                tr.appendChild(td);
                var input = document.createElement('input');
                td.appendChild(input);
                input.name = cells[cell].name;
                input.value = row[cells[cell].name];
                input.type = cells[cell].type;
                input.setAttribute('form', row_id);
            }

            //create select cell and input for lbs
            var select = document.createElement('select');
            select_cell = document.createElement('td');
            select_cell.appendChild(select);
            tr.appendChild(select_cell);
            var optionOne = document.createElement('option');
            optionOne.textContent = 'Lbs';
            optionOne.value = 1;
            select.appendChild(optionOne);
            var optionTwo = document.createElement('option');
            optionTwo.textContent = 'Kg';
            optionTwo.value = 0;
            select.appendChild(optionTwo);
            select.value = select_value;
            select.name = 'lbs';
            select.setAttribute('form', row_id);
            delete row['lbs'];

            //adds event listener for updating form
            //function is ridiculous and should be split up into multiple functions
            update_form.addEventListener('submit',
                function (row_id, original_row) {
                    var context = {};
                    //set cell values
                    for (var i = 0; i < this.elements.length; i++) {
                        context[this.elements[i].name] = this.elements[i].value;
                    }
                    var node = this;
                    while (node != null) {
                        if (node.tagName == 'TR') {
                            context.id = row_id;

                            //sets update row callback function when updating row
                            var updateRow = function (original_row, result) {
                                if (result) {
                                    var tbody = document.getElementById('fitness-data');
                                    clearCells(tbody);
                                    //percolates table-cell, coloring borders when new data is updated
                                    for (var i in this.childNodes) {
                                        var elem = this.childNodes[i];
                                        if (elem.tagName == 'TD') {
                                            for (var k in original_row) {
                                                if (k == elem.childNodes[0].name) {
                                                    if (elem.childNodes[0].value != original_row[k]){
                                                        original_row[k] = elem.childNodes[0].value;
                                                        elem.style.border = '3px solid teal';
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                //handles update errors if results not present
                                //colors row's bad input cel with red on error
                                else {
                                    for (var i in this.childNodes) {
                                        var elem = this.childNodes[i];
                                        if (elem.tagName == 'TD') {
                                            for (var k in original_row) {
                                                if (k == elem.childNodes[0].name) {
                                                    if (elem.childNodes[0].value != original_row[k]){
                                                        elem.style.border = '3px solid maroon';
                                                        elem.childNodes[0].value = original_row[k];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }.bind(node, original_row);
                            makeXMLHttpRequest('UPDATE', updateRow)(context);
                        }
                        node = node.parentNode;
                    }
                    event.preventDefault();
                }.bind(update_form, row_id, original_row)
            );

            //creates update cell and form
            var update_cell = document.createElement('td');
            update_cell.appendChild(update_row_id);
            update_row_id.setAttribute('form', row_id);
            tr.appendChild(update_cell);
            var update_button = document.createElement('input');
            update_cell.appendChild(update_button);
            update_button.type = 'submit';
            update_button.value = "+";
            update_button.setAttribute('form', row_id);

            //creates delete cell and form
            var delete_cell = document.createElement('td');
            tr.appendChild(delete_cell);
            var delete_form = document.createElement('form');
            delete_cell.appendChild(delete_form);
            delete_form.appendChild(delete_row_id);
            delete_form.setAttribute('class', 'display');

            //creates call back on submit
            delete_form.addEventListener('submit',
                function (row_id) {
                    var node = this;
                    while (node != null) {
                        if (node.tagName == 'TR') {
                            var context = {};
                            context.id = row_id;
                            //create callback when row is deleted, deleting row and resetting borders
                            var deleteRow = function (node) {
                                var tbody = document.getElementById('fitness-data');
                                clearCells(tbody);
                                node.parentNode.removeChild(node);
                            }.bind(null, node);
                            makeXMLHttpRequest('DELETE', deleteRow)(context);
                        }
                        node = node.parentNode;
                    }
                    event.preventDefault();
                }.bind(delete_form, row_id)
            );
            var delete_button = document.createElement('input');
            delete_form.appendChild(delete_button);
            delete_button.type = 'submit';
            delete_button.value = '-';
        }
    }
}


var addRow = makeXMLHttpRequest('INSERT', renderTable);
var initTable = makeXMLHttpRequest('SELECT', renderTable);

//initializes table and adds callback to form row
function onLoad(){
    initTable();
    var addFitness = document.getElementById('add-fitness');
    addFitness.addEventListener('submit', function(event){
        var row = {};
        for (var i=0; i<this.elements.length; i++){
            var tbody = document.getElementById('fitness-data');
            clearCells(tbody);
            row[this.elements[i].name] = this.elements[i].value;
        }
        addRow(row);
        event.preventDefault();
    });

}

//genesis
onLoad();