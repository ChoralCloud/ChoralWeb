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
});
