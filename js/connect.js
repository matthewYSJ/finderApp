
var knownDevices = {}
var savedDevices = {}
var deviceToSave;

var config = {
    serviceUUID: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
    txCharacteristic: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E", // transmit is from the phone's perspective
    rxCharacteristic: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"  // receive is from the phone's perspective
};


$('#addDevice').on("click", function(){  
    $('#devices').html("");  
    searchDevices();
});

$('#refresh').on("click", function(){  
    $('#saved').html("");  
    getDevices();
});


$('#stop_looking').on("click", function(){  
    ble.stopScan();
    $('#track_menu').addClass('d-none');
    $('#main_menu').removeClass('d-none');
});

function searchDevices(){    
    $('.tracker').html("");
    console.log('startScan');
    ble.startScan(function(r)
	{
        $('#devices').html("");
        if(savedDevices[r.address] ==null){
            knownDevices[r.address] = r;
        }
        if(Object.keys(knownDevices).length > 0){
            $.each(knownDevices, function(key,value){
                $('#devices').append(
                    "<li class='device_list' data-address='"+ value.address+"'>"+
                        value.name + "</br>" +
                        value.address + "</br>"+
                    "</li>"
                );
                $('.device_list').on('click', function(){ 
                    deviceToSave = $(this).data('address');     
                    chooseName();                         
                });    
            });
        }else{
           $('#devices').append(
               "<li class='device_list'>No Devices Found</li>"
           );
        }
        ble.stopScan();
        
	}, function(errorCode)
	{
		console.log('startScan error: ' + errorCode);
    });
}

function chooseName(){
    $('#chooseName').removeClass('d-none');
    $('#main_menu').addClass('d-none');

    $('#setName').on('submit', function(e){
        e.preventDefault();
        saveDevice($('#getName').val());
    });
}


function getDevices(){
    ble = evothings.ble; 
    console.log("searching");
    $.ajax({
		type: "POST",
		url: "http://www.installet.com/json.php",
		data: {'type' : "getapi"},
		dataType: 'json',
		success: function(data){
			showSaved(data);
		},error : function(){
            console.log("fail");
        }
    });
}

function saveDevice(name){
    var data = knownDevices[deviceToSave];
    data['type'] = "api";
    data['ownName'] = name;
    $.ajax({
		type: "POST",
		url: "http://www.installet.com/json.php",
		data: data,
		dataType: 'json',
		success: function(data){			
		},error : function(){
            console.log("fail");
        }
    });

    $('#chooseName').addClass('d-none');
    $('#main_menu').removeClass('d-none');
    
}

$('#back').on('click', function(){
    $('#chooseName').addClass('d-none');
    $('#main_menu').removeClass('d-none');
});

function showSaved(data){
    $.each(data, function(key,value){
        savedDevices[value.deviceAddress] = value;
        $('#saved').append(
            "<li class='saved_list' data-address='"+ value.deviceAddress+"'>"+
                value.deviceName +
            "</li>"
        );
        $('.saved_list').on('click', function(){ 
            track($(this).data('address'));                      
        });  
    });
}

function track(address){
    console.log('searching');
    $('#main_menu').addClass('d-none');
    $('#track_menu').removeClass('d-none');
    $('#deviceName').html( savedDevices[address]['deviceName']);
   startTracking(address);
}

function startTracking(address){
    ble = evothings.ble; 
    $('.tracker').html("<p>Searching - we've lost the scent</p>");
    ble.startScan(function(r)
	{        
        if(r.address == address){
            var txPower = -59 //hard coded power value. Usually ranges between -59 to -65
            var distance = 0;
            if (r.rssi == 0) {
                distance -1.0; 
            }
          
            var ratio = r.rssi*1.0/txPower;
            if (ratio < 1.0) {
                distance = Math.pow(ratio,10);
            }
            else {
              distance =  (0.89976)*Math.pow(ratio,7.7095) + 0.111; 
             }
             $('.tracker').html("<h3>We got a sniff!!!</h3><p>Distance: "+ distance.toFixed(2) + "</p>");
        }

    }, function(errorCode)
	{
		console.log('startScan error: ' + errorCode);
	});
}

document.addEventListener('deviceready', getDevices, false);