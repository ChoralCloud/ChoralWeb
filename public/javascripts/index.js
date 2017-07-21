function addViewChoralHandlers() {
  var $buttonNodes = document.getElementsByClassName('view-choral-btn');

  for (var i = 0; i < $buttonNodes.length; i++) {
    var $node = $buttonNodes[i];
    $node.onclick = viewChoralHandler;
  }
}

function viewChoralHandler(e) {
  $.ajax({ // send a GET request
    url: '/chorals/' + this.dataset.choralId,
    type: 'GET'
  })
    .always(() => {
      window.location.href = 'chorals/' + this.dataset.choralId;
    });
}

function addCopyChoralHandlers() {
  var $buttonNodes = document.getElementsByClassName('copy-choral-btn');

  for (var i = 0; i < $buttonNodes.length; i++) {
    var $node = $buttonNodes[i];
    $node.onclick = copyChoralHandler;
  }
}

function copyChoralHandler(e) {
  var dummy = document.createElement("input");
  document.body.appendChild(dummy);
  dummy.setAttribute("id", "dummy_id");
  document.getElementById("dummy_id").value = this.dataset.choralId;
  dummy.select();
  document.execCommand('copy', false, this.dataset.choralId);
  document.body.removeChild(dummy);
  alert("Copied to clipboard!");
}

function addDeleteChoralHandlers() {
  var $buttonNodes = document.getElementsByClassName('delete-choral-btn');

  for (var i = 0; i < $buttonNodes.length; i++) {
    var $node = $buttonNodes[i];
    $node.onclick = deleteChoralHandler;
  }
}

function deleteChoralHandler(e) {
  $.ajax({ // send a DELETE request
    url: '/chorals/' + this.dataset.choralId,
    type: 'delete'
  })
    .always(() => {
      window.location.href = 'chorals'; // refresh the chorals page
    });
}


$(document).ready(function() {
  addDeleteChoralHandlers();
  addCopyChoralHandlers();
  addViewChoralHandlers();
});

function createCookie(value) {
  //find highest child cookie 
  for(var i = 0; readCookie('child' + i) != null; i++);

  var date = new Date();
	date.setTime(date.getTime()+(60*60*1000));
	var expires = "; expires="+date.toGMTString();

	document.cookie = "child" + i + "=" + value + expires + "; path=/";
  alert("Child # " + i + " Added to List");
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0){
      return c.substring(nameEQ.length,c.length);
    } 
	}
	return null;
}

function somefunc() {
  alert("HIIII");
  alert("HI AGAIN");
  alert("HIHIHI");
}
