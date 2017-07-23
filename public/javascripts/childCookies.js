function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function createChildCookie(choral) {
  choral = JSON.parse(choral);
  for(var i = 0; readCookie('child' + i) != null; i++);

  var date = new Date();
	date.setTime(date.getTime()+(2*60*1000)); //2 minutes expiration
	var expires = "; expires="+date.toGMTString();

	document.cookie = 'child' + i + '= {"name": "' + choral.name + '", "choralId": "' + choral.choralId + '"}' + expires + '; path=/';
  alert("Child # " + i + " Added to List");
  listAllChildren();
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

function listAllChildren(){
  var childrenList = '';
  childrenList += '<ul>';
  //contains value of cookie
  for(var i = 0; readCookie('child' + i) != null; i++){
    childCookie = readCookie('child' + i);
    childCookie = JSON.parse(childCookie);
    childrenList +='<li>' + childCookie.name + '</li>';
  }
  childrenList += '</ul>';
  document.getElementById('childrenList').innerHTML= childrenList;
}

function readAllChildren(){
  //contains value of cookie
  for(var i = 0; readCookie('child' + i) != null; i++){
    childCookie = readCookie('child' + i);
    childCookie = JSON.parse(childCookie);
  }
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}
