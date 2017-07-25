function addViewChoralHandlers() {
  var $buttonNodes = document.getElementsByClassName('view-choral-btn');

  for (var i = 0; i < $buttonNodes.length; i++) {
    var $node = $buttonNodes[i];
    $node.onclick = viewChoralHandler;
  }
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
