// -*- coding: utf-8 -*-
// add-on for anki program "Simple Image Occlusion" 
// https://github.com/AndreyKaiu/Anki_Simple-Image-Occlusion
// Version 2.0, date: 2026-05-09
var creation_mode = 0; // rectangle creation mode
var disable_context_menu = false;
const containerImg = document.getElementsByClassName('sio-image-container')[0];
const img = document.getElementsByClassName('sio-image')[0];
const selBtn = document.getElementById('selBtn');
const addBtn = document.getElementById('addBtn');
const removeBtn = document.getElementById('removeBtn');
const add2Btn = document.getElementById('add2Btn');
const addLine = document.getElementById('addLine');
const exchangeBtn = document.getElementById('exchangeBtn');
const scale200Btn = document.getElementById('scale200Btn');
var isScaled200 = false;
var selectedRect = null;
var formn1 = 0; // form number creation_mode == 1
var formn2 = 0; // form number creation_mode == 2
var formn3 = 0; // form number creation_mode == 3

var startX, startY; // Initial coordinates
var isDrawing = false; // Flag to track drawing
var wasDragElement = false; // dragged element

const undoStack = [];
const redoStack = [];

const scrollContainer = document.scrollingElement;
var scroll100 = { left: 0, top: 0 };
var scroll200 = { left: 0, top: 0 };


// Disable image dragging
img.addEventListener('dragstart', function (e) {
	e.preventDefault(); // Override default drag behavior
});



function resetModes() {
	if(creation_mode == 4) creation_mode = 0;
	else {
		addRectangle(4);
		return;
	}

	document.querySelectorAll('img')[0].style.cursor = 'default';
	selBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
	addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
	add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
	addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
	
	document.querySelectorAll('.sio-rect').forEach(rect => {	
		rect.classList.add('cursor-move');	
		rect.classList.remove('cursor-copy');
		rect.classList.remove('cursor-crosshair');
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
		rect.classList.remove('selectarea');
		// rect.classList.remove('selected');  let's leave the selected ones
	});
	document.querySelectorAll('.txt-sio-rect.text-editable').forEach(rect => {
		rect.classList.remove('text-editable');
		rect.contentEditable = false;
		rect.parentElement.classList.remove('text-editing'); //Remove the class of editing mode		
	});
	//selectedRect = null; let's leave the selected ones
}

function setCursorToEnd(element) {
	if (element.isContentEditable) {
		const range = document.createRange();
		const selection = window.getSelection();
		range.selectNodeContents(element); // Select the element contents
		range.collapse(false); // Set the cursor to the end
		selection.removeAllRanges(); // Clear the current selection
		selection.addRange(range); // Set a new range
	}
}

document.addEventListener('keydown', function (e) {
	if ((e.key === 'Enter' || e.key === 'Tab') && !(e.ctrlKey || e.metaKey) && !e.altKey ) {  
		e.preventDefault(); // Prevent default behavior
		updateResize();

		// Find all elements with class "txt-sio-rect"
		const rectanglesALL = Array.from(document.querySelectorAll('.txt-sio-rect'));
		const rectangles = rectanglesALL.filter(rect => !rect.parentElement.classList.contains('hiding')
			&& !rect.parentElement.classList.contains('line'));

		if (rectangles.length === 0) return; // If there are no rectangles, do nothing

		// Determine the current element with focus
		const activeElement = document.activeElement;
		const currentIndex = rectangles.indexOf(activeElement);
		if (currentIndex >= 0) {
			rectangles[currentIndex].parentElement.classList.remove('selected');			
		}

		let incN = +1;
        if(e.shiftKey) incN = -1; 
		// We go to the next element or return to the first
		let nextIndex = (currentIndex + incN) % rectangles.length;
		if(currentIndex==0 && incN == -1) nextIndex = rectangles.length - 1;
		const nextRectangle = rectangles[nextIndex];

		document.querySelectorAll('.sio-rect.selected').forEach(rect => {
			rect.classList.remove('selected');
		});

		nextRectangle.contentEditable = true;
		nextRectangle.classList.add('text-editable');
		selectedRect = nextRectangle.parentElement;		
		selectedRect.classList.add('selected');		
		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.remove('selectedRect');
		});
		selectedRect.classList.add('selectedRect');
		selectedRect.classList.remove('transparent');
		selectedRect.classList.add('text-editing'); //Add a class for editing

		// Install the focus on the next element
		nextRectangle.focus();
		setCursorToEnd(nextRectangle);

		// Scroll the screen to the next element
		let lp = nextRectangle.style.left;
		if (lp.indexOf("%", 1) > 0) {
			lp = parseFloat(lp);
			if (lp <= 30) nextRectangle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
			else if (lp >= 65) nextRectangle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'end' });
			else nextRectangle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
		}
		else nextRectangle.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
});


function addRectangle(value) {	
	if(value == 0) {
		document.querySelectorAll('img')[0].style.cursor = 'default';
		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.add('cursor-move');	
			rect.classList.remove('cursor-copy');
			rect.classList.remove('cursor-crosshair');
		});
	}
	else if(value < 4) {
		document.querySelectorAll('img')[0].style.cursor = 'copy';
		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.remove('cursor-move');
			rect.classList.remove('selectarea');
			rect.classList.add('cursor-copy');
		});
	}
	else if(value == 4) {
		document.querySelectorAll('img')[0].style.cursor = 'crosshair';
		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.remove('cursor-move');	
			rect.classList.remove('cursor-copy');
			rect.classList.add('cursor-crosshair');
		});
	}

	if (value === 0) {
		creation_mode = 0;
		document.querySelectorAll('.sio-rect').forEach(rect => {			
			rect.classList.remove('selectarea');
		});		
		selBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
		return;
	}
	else if (value === 1) {		
		if (creation_mode === 1) {
			creation_mode = 0;
			addRectangle(0);
			return;
		}		
		creation_mode = 1;
		addBtn.style.backgroundColor = "#ef7280";
		selBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
	} else if (value === 2) {
		if (creation_mode === 2) {
			creation_mode = 0;
			addRectangle(0);
			return;
		}			
		creation_mode = 2;
		add2Btn.style.backgroundColor = "#ef7280";
		selBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
	} else if (value === 3) {
		if (creation_mode === 3) {
			creation_mode = 0;
			addRectangle(0);
			return;
		}		
		creation_mode = 3;
		addLine.style.backgroundColor = "#ef7280";
		selBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
	} else if (value === 4) {
		if (creation_mode === 4) {
			creation_mode = 0;
			addRectangle(0);
			return;
		}		
		creation_mode = 4;
		selBtn.style.backgroundColor = "#959596";
		addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
	}
}


// Mouse presser
containerImg.onmousedown = function (e) {
	if (creation_mode === 0) return; //If the mode is not selected, we do nothing
	if(  (e.ctrlKey || e.metaKey) && (creation_mode > 0 && creation_mode < 4) ) return; 

	saveState();	

	isDrawing = true;
	startX = e.offsetX; //initial coordinate x
	startY = e.offsetY; //initial coordinate y
	if( !e.target.classList.contains('sio-image') ) {
		const mouseX = e.clientX; // We get the coordinates of the click in the window
		const mouseY = e.clientY;
		const container = e.target.closest('.sio-image-container'); // Find the closest parent container
		if (!container) return;
		const img = container.querySelector('.sio-image'); // We look for an image inside it.
		if (!img) return;
		const imgRect = img.getBoundingClientRect(); // We get the coordinates of the image on the screen	
		const offsetX = mouseX - imgRect.left; // Calculate the coordinates of the click relative to the image
		const offsetY = mouseY - imgRect.top;
		startX = offsetX;
		startY = offsetY;
	}

	// We create a temporary rectangle
	const tempRect = document.createElement('div');
	tempRect.className = 'sio-rect temp-sio-rect';
	tempRect.style.left = `${startX}px`;
	tempRect.style.top = `${startY}px`;
	tempRect.style.width = '0px';
	tempRect.style.height = '0px';
	if (creation_mode == 3) tempRect.classList.add('line');
	else {
		tempRect.classList.add('transparent');
		if (creation_mode == 2) tempRect.classList.add('hiding');
		else if (creation_mode == 4) tempRect.classList.add('selectarea');
	}
	containerImg.appendChild(tempRect);
	containerImg.focus();
};


// Mouse motion handler
containerImg.onmousemove = function (e) {
	if (!isDrawing) return; //if we do not draw, we do nothing

	// We use getBoundingClientRect For accurate coordinates
	const rect = containerImg.getBoundingClientRect();
	const currentX = e.clientX - rect.left;
	const currentY = e.clientY - rect.top;

	// We check that the coordinates are not negative
	if (currentX < 0 || currentY < 0) {
		return;
	}

	const tempRect = document.querySelector('.temp-sio-rect');
	if (!tempRect) return;

	// We calculate the size and position of the rectangle
	let width = Math.abs(currentX - startX);
	let height = Math.abs(currentY - startY);
	let left = Math.min(currentX, startX);
	let top = Math.min(currentY, startY);

	if (creation_mode == 3) { // For the line		
		if(e.altKey) {
			let stepSc = isScaled200 ? 20 : 10;
			width = Math.round(width/stepSc)*stepSc;   
			height = Math.round(height/stepSc)*stepSc;
		}

		tempRect.classList.add('line');
		let x1, y1, x2, y2;
		x1 = startX;
		y1 = startY;
		x2 = currentX;
		y2 = currentY;
		// We calculate the length and angle of the line
		const deltaX = x2 - x1;
		const deltaY = y2 - y1;
		const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
		tempRect.style.left = `${x1}px`;
		tempRect.style.top = `${y1}px`;
		tempRect.style.width = `${length}px`;
		tempRect.style.height = `2px`; // The thickness of the line
		tempRect.style.transform = `rotate(${angle}deg)`;
	}
	else {
		if(e.shiftKey) {
			if(width > height) height = width;
			else width = height;  
		}
		if(e.ctrlKey) {			
			let stepSc = isScaled200 ? 20 : 10;
			width = Math.round(width/stepSc)*stepSc;   
			height = Math.round(height/stepSc)*stepSc;
		}
		if(e.altKey) {
			width = 2*width;
			height = 2*height;
			left = Math.min(currentX, startX) - width/2;
			top = Math.min(currentY, startY) - height/2;
		}

		tempRect.style.width = `${width}px`;
		tempRect.style.height = `${height}px`;
		tempRect.style.left = `${left}px`;
		tempRect.style.top = `${top}px`;
		tempRect.classList.add('transparent');
		if (creation_mode == 2) tempRect.classList.add('hiding');
		else if (creation_mode == 4) tempRect.classList.add('selectarea');
	}

};



// Mouse release handler
containerImg.onmouseup = function (e) {
	if (!isDrawing) return; //if we do not draw, we do nothing

	isDrawing = false;

	const tempRect = document.querySelector('.temp-sio-rect');
	if (!tempRect) return;

	if (tempRect.classList.contains('line')) {
		const width = parseInt(tempRect.style.width, 10);
		if (width < 10) {
			tempRect.remove();
		} else {
			// We convert a temporary rectangle to constant
			tempRect.classList.remove('temp-sio-rect');

			const rectimg = img.getBoundingClientRect(); //Get real dimensions and position
			const imgWidth = rectimg.width; //Image width
			const imgHeight = rectimg.height; //Image height
			const imgLeft = rectimg.left; //image position by x
			const imgTop = rectimg.top;//Image Images by Y	

			const trn = tempRect.style.transform;
			tempRect.style.transform = `rotate(0deg)`;
			const rect = tempRect.getBoundingClientRect(); //Get real dimensions and position
			const rectWidth = rect.width; //The width of the rectangle
			const rectHeight = rect.height; //The height of the rectangle
			const rectLeft = rect.left; //Position of a rectangle by x
			const rectTop = rect.top; //Position of a rectangle on y
			tempRect.style.transform = trn;

			const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;
			const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
			const widthPercent = (rectWidth / imgWidth) * 100;
			const heightPercent = (rectHeight / imgHeight) * 100;

			tempRect.style.left = `${leftPercent}%`;
			tempRect.style.top = `${topPercent}%`;
			tempRect.style.width = `${widthPercent}%`;
			tempRect.style.height = "2px";
			//tempRect.style.height = `${heightPercent}%`;

			['nw', 'ne', 'sw', 'se'].forEach(corner => {
				const handle = document.createElement('div');
				//handle.setAttribute("title", "RMouse - rotate");
				handle.className = `resize-handle ${corner}`;
				tempRect.appendChild(handle);
			});

			tempRect.setAttribute('data-word', '');
			tempRect.setAttribute('data-hint', '');
			if (creation_mode === 1) {
				if(formn1==1) tempRect.classList.add('round');
			}
			if (creation_mode === 2) {
				tempRect.classList.add('hiding');
				if(formn2==1) tempRect.classList.add('round');
			}
			if (creation_mode === 4) tempRect.classList.add('selectarea');
			if (creation_mode === 3) {
                tempRect.classList.add('line');
                if(formn3==1) tempRect.classList.add('notvisible');
            }
            

			tempRect.classList.remove('transparent');
			tempRect.classList.add('cursor-copy');

			// Add a text element .txt-sio-rect
			const textDiv = document.createElement('div');
			textDiv.className = 'txt-sio-rect';
			tempRect.appendChild(textDiv);
			
			setTimeout(() => {				
				document.querySelectorAll('.sio-rect').forEach(rect => {
					rect.classList.remove('selected');					
				});
				tempRect.classList.add('selected');				
				selectedRect = tempRect;
				document.querySelectorAll('.sio-rect').forEach(rect => {
					rect.classList.remove('selectedRect');
				});
				selectedRect.classList.add('selectedRect');
			}, 50); //delay of 50 ms

			// Add handlers for a new rectangle
			makeDraggable(tempRect);
			makeResizable(tempRect);
			addClickHandlers(tempRect);
		}

	}
	else if (tempRect.classList.contains('selectarea')) {
		tempRect.classList.remove('temp-sio-rect');
		const rectimg = img.getBoundingClientRect(); //Get real dimensions and position
		const imgWidth = rectimg.width; //Image width
		const imgHeight = rectimg.height; //Image height
		const imgLeft = rectimg.left; //image position by x
		const imgTop = rectimg.top;//Image Images by Y	

		const rect = tempRect.getBoundingClientRect(); //Get real dimensions and position
		const rectWidth = rect.width; //The width of the rectangle
		const rectHeight = rect.height; //The height of the rectangle
		const rectLeft = rect.left; //Position of a rectangle by x
		const rectTop = rect.top; //Position of a rectangle on y

		const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;
		const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
		const widthPercent = (rectWidth / imgWidth) * 100;
		const heightPercent = (rectHeight / imgHeight) * 100;

		tempRect.style.left = `${leftPercent}%`;
		tempRect.style.top = `${topPercent}%`;
		tempRect.style.width = `${widthPercent}%`;
		tempRect.style.height = `${heightPercent}%`;
		let invSelected = e.shiftKey && rectWidth < 5 && rectHeight < 5;
		if( !(e.shiftKey || e.altKey) ) {
			document.querySelectorAll('.sio-rect.selected').forEach(rect => {
				rect.classList.remove('selected');
			});
		}
		
		setTimeout( ()=>{
			const a = percentToPx(tempRect, img);
			//console.log('a=', a);
			document.querySelectorAll('.sio-rect:not(.selectarea)').forEach(el => {
				const b = percentToPx(el, img);
				//console.log('b=', b);
				const hit = sat(a, b);
				if (hit) {
					if(e.altKey) el.classList.remove('selected');
					else {
						if(invSelected && el.classList.contains('selected')) {
							el.classList.remove('selected');
							if(selectedRect == el) {
								selall = document.querySelectorAll('.sio-rect.selected');
								if(selall.length > 0) selectedRect = selall[selall.length-1];
								else {
									selectedRect = null;
									document.querySelectorAll('.sio-rect').forEach(rect => {
										rect.classList.remove('selectedRect');
									});									
								}
							}
						}
						else {
							el.classList.add('selected');
							selectedRect = el;
							document.querySelectorAll('.sio-rect').forEach(rect => {
								rect.classList.remove('selectedRect');
							});
							selectedRect.classList.add('selectedRect');
						}
					}
				} else {
					//el.classList.remove('selected');
				}
			});
			
			tempRect.remove();
		}, 50);
	}
	else {
		// Checking for the minimum size
		const width = parseInt(tempRect.style.width, 10);
		const height = parseInt(tempRect.style.height, 10);
		if (width < 10 || height < 10) {
			tempRect.remove();
		} else {
			// We convert a temporary rectangle to constant
			tempRect.classList.remove('temp-sio-rect');

			const rectimg = img.getBoundingClientRect(); //Get real dimensions and position
			const imgWidth = rectimg.width; //Image width
			const imgHeight = rectimg.height; //Image height
			const imgLeft = rectimg.left; //image position by x
			const imgTop = rectimg.top;//Image Images by Y	

			const rect = tempRect.getBoundingClientRect(); //Get real dimensions and position
			const rectWidth = rect.width; //The width of the rectangle
			const rectHeight = rect.height; //The height of the rectangle
			const rectLeft = rect.left; //Position of a rectangle by x
			const rectTop = rect.top; //Position of a rectangle on y

			const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;
			const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
			const widthPercent = (rectWidth / imgWidth) * 100;
			const heightPercent = (rectHeight / imgHeight) * 100;

			tempRect.style.left = `${leftPercent}%`;
			tempRect.style.top = `${topPercent}%`;
			tempRect.style.width = `${widthPercent}%`;
			tempRect.style.height = `${heightPercent}%`;

			['nw', 'ne', 'sw', 'se'].forEach(corner => {
				const handle = document.createElement('div');
				handle.setAttribute("title", "RMouse→Rotate; Shift→□,step; Ctrl→step, Alt→center");
				handle.className = `resize-handle ${corner}`;
				tempRect.appendChild(handle);
			});

			tempRect.setAttribute('data-word', '');
			tempRect.setAttribute('data-hint', '');
			if (creation_mode === 1) {
				if(formn1==1) tempRect.classList.add('round');
			}
			if (creation_mode === 2) {
				tempRect.classList.add('hiding');
				if(formn2==1) tempRect.classList.add('round');
			}
			if (creation_mode === 4) tempRect.classList.add('selectarea');
			if (creation_mode === 3) {
				tempRect.classList.add('line');
				if(formn3==1) tempRect.classList.add('notvisible');
			}


			tempRect.classList.remove('transparent');
			tempRect.classList.add('cursor-copy');

			// Add a text element .txt-sio-rect
			const textDiv = document.createElement('div');
			textDiv.className = 'txt-sio-rect';
			tempRect.appendChild(textDiv);

			setTimeout(() => {
				document.querySelectorAll('.sio-rect').forEach(rect => {
					rect.classList.remove('selected');					
				});
				tempRect.classList.add('selected');				
				selectedRect = tempRect;
				document.querySelectorAll('.sio-rect').forEach(rect => {
					rect.classList.remove('selectedRect');
				});
				selectedRect.classList.add('selectedRect');
			}, 50); //delay of 50 ms

			// Add handlers for a new rectangle
			makeDraggable(tempRect);
			makeResizable(tempRect);
			addClickHandlers(tempRect);
		}
	}

	// We delete all the remaining temporary rectangles
	document.querySelectorAll('.temp-sio-rect').forEach(rect => rect.remove());
};




function cloneRectangle() {	
	saveState();		
	const rectimg = img.getBoundingClientRect();
	const imgWidth = rectimg.width;
	const imgHeight = rectimg.height;
	document.querySelectorAll('.sio-rect.selected').forEach(rect => {
		const clone = rect.cloneNode(true);				
		const left = parseFloat(rect.style.left) || 0;
        const top = parseFloat(rect.style.top) || 0;				
		const height = parseFloat(rect.style.height) || 0;	
		//const step = 2.5; // %		
		let spaceH = isScaled200 ? 20.0 : 10.0;
		const step = height + (spaceH/imgHeight)*100.0;   		
		let newLeft = left; // + step; more convenient
        let newTop = top + step;
		clone.style.left = newLeft + '%';
        clone.style.top = newTop + '%';		
        rect.parentNode.appendChild(clone);
		makeDraggable(clone);
		makeResizable(clone);
		addClickHandlers(clone);
	});
}


function removeRectangle() {
	saveState();
	document.querySelectorAll('.sio-rect.selected').forEach(rect => {
		if(rect == selectedRect) {
			selectedRect = null;
			document.querySelectorAll('.sio-rect').forEach(rect => {
				rect.classList.remove('selectedRect');
			});			
		}
		rect.classList.remove('selected');
		rect.remove();
	});

	if(selectedRect == null) {
		selall = document.querySelectorAll('.sio-rect.selected');
		if(selall.length > 0)
			selectedRect = selall[selall.length-1];
		else
			selectedRect = null;
		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.remove('selectedRect');
		});
		if(selectedRect != null) selectedRect.classList.add('selectedRect');
	}
}


function removeAllRectangle() {
	saveState();
	const rectangles = document.querySelectorAll('.sio-rect');
	rectangles.forEach(rect => rect.remove());
	selectedRect = null;
	document.querySelectorAll('.sio-rect').forEach(rect => {
		rect.classList.remove('selectedRect');
	});
	if(selectedRect != null) selectedRect.classList.add('selectedRect');
}


document.addEventListener('keydown', function (e) {
	if (e.key === 'Delete' && !e.altKey && (e.ctrlKey || e.metaKey || e.shiftKey) ) {
		e.preventDefault();
		e.stopPropagation();
		if( (e.ctrlKey || e.metaKey)  ) {			
			if (!e.shiftKey) {
				removeRectangle();
			}
			else {
				removeAllRectangle();
			}			
		}
		else if( e.shiftKey ) {
			removeRectangle();
		}	
		return;
	}
	
	if ( e.code === "KeyA" && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		saveState();
		document.querySelectorAll('.sio-rect').forEach(rect => {	
			rect.classList.add('selected');
		});
		return;
	}	
	
	if( e.code === "KeyD" && (e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey ) {			
		e.preventDefault();
		e.stopPropagation();		
		cloneRectangle();
		return;		
	}

	if( e.code === "KeyZ" && (e.ctrlKey || e.metaKey) && !e.altKey ) {
		const activeElement = document.activeElement;
		if(activeElement && activeElement.contentEditable=="true") return;
		e.preventDefault();
		e.stopPropagation();
		if(!e.shiftKey) undo();
		else redo();
		return;	
	}


	if( (e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey ) {		

		if  (e.code === "KeyL" ) {
			e.preventDefault();
			e.stopPropagation();
			alignSelectedRect('L');
			return;
		}
		if  (e.code === "KeyT") {
			e.preventDefault();
			e.stopPropagation();
			alignSelectedRect('T');
			return;
		}
		if  (e.code === "KeyW") {
			e.preventDefault();
			e.stopPropagation();
			alignSelectedRect('W');
			return;
		}
		if  (e.code === "KeyH") {
			e.preventDefault();
			e.stopPropagation();
			alignSelectedRect('H');
			return;
		}
		if  (e.code === "KeyR") {
			e.preventDefault();
			e.stopPropagation();
			alignSelectedRect('R');
			return;
		}
	}
	



	if (e.key === 'Escape' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		// if in text editing mode, then exit
		const elset = document.querySelectorAll('.sio-rect.text-editing');
		if(elset.length > 0) {			
			document.querySelectorAll('.txt-sio-rect.text-editable').forEach(rect => {
				rect.classList.remove('text-editable');
				rect.contentEditable = false;
				rect.parentElement.classList.remove('text-editing'); //Remove the class of editing mode		
			});
			elset.forEach(rect => rect.classList.remove('text-editing'));
		}
		else {
			resetModes();
		}		
		
		return;
	}
	
	if (e.key === 'F1' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		scale200();
		return;
	}
    
    if (e.key === 'F2' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		editText();
		return;
	}

	if (e.key === 'F3' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		showhideRectangle();
		return;
	}

	if (e.key === 'F4' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		exchangeRectangle();
		return;
	}

	if ( (e.key === 'F5' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) 
		 || (e.key === 'F1' && !(e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) ) {
		e.preventDefault();
		e.stopPropagation();
		showhideAllRectangle();
		return;
	}

	if (e.key === 'F6' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		rectangleToRound();
		return;
	}

	if (e.key === 'F7' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		addRectangle(1);
		return;
	}

	if (e.key === 'F8' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		addRectangle(2);
		return;
	}

	if (e.key === 'F9' && !(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		addRectangle(3);
		return;
	}



});



function makeDraggable(element) {
	let oldcursor = '';
	let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	let sizeSelGr = {
		left: null,
		top: null,
		right: null,
		bottom: null		
	};
	
	let fixPosX = 0, alldX=0;
	let fixPosY = 0, alldY=0;	

	element.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		if (e.target.className.includes('resize-handle')
			|| !element.classList.contains('selected') || element.classList.contains('text-editing')
			|| (creation_mode > 0 && !e.ctrlKey)
		) return; //block dragging in editing mode
		
		if( (e.ctrlKey || e.metaKey) /*&& (creation_mode > 0 && creation_mode < 4)*/ ) {
			e.stopPropagation();		
			selectedRect = element;	
			document.querySelectorAll('.sio-rect').forEach(rect => {
				rect.classList.remove('selectedRect');
			});
			if(selectedRect != null) selectedRect.classList.add('selectedRect');
			
			oldcursor = document.querySelectorAll('img')[0].style.cursor;
			document.querySelectorAll('img')[0].style.cursor = 'move';
			//selectedRect.style.cursor = 'move';
			if(selectedRect) selectedRect.classList.add('cursor-move');
		}
		else {
			if( creation_mode > 0 ) {
				return; //block dragging in editing mode
			}
		}

		saveState();
		e.preventDefault();
		
		let els = document.querySelectorAll('.sio-rect.selected');
		for(i=0; i<els.length; ++i) {
			let rectSel = els[i];
			if(sizeSelGr.left == null || sizeSelGr.left > rectSel.offsetLeft) 
				sizeSelGr.left = rectSel.offsetLeft; 
			if(sizeSelGr.top == null || sizeSelGr.top > rectSel.offsetTop) 
				sizeSelGr.top = rectSel.offsetTop;
			if(sizeSelGr.right == null || sizeSelGr.right < (rectSel.offsetLeft + rectSel.offsetWidth) ) 
				sizeSelGr.right = (rectSel.offsetLeft + rectSel.offsetWidth);
			if(sizeSelGr.bottom == null || sizeSelGr.bottom < (rectSel.offsetTop + rectSel.offsetHeight) ) 
				sizeSelGr.bottom = (rectSel.offsetTop + rectSel.offsetHeight);
		}		
		
		
		for(i=0; i<els.length; ++i) {
			let rectSel = els[i];
			let posInSelX = rectSel.offsetLeft - sizeSelGr.left; 
			let posInSelY = rectSel.offsetTop - sizeSelGr.top;
			rectSel.setAttribute('posInSelX', posInSelX);
			rectSel.setAttribute('posInSelY', posInSelY);
		}			
			
		pos3 = e.clientX;
		pos4 = e.clientY;
		
		fixPosX = e.clientX; 
		fixPosY = e.clientY;
		
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {		
		e.preventDefault();		
		
		let eclientX = e.clientX;
		let eclientY = e.clientY;		
		alldX += Math.abs(fixPosX-e.clientX); 
		alldY += Math.abs(fixPosY-e.clientY);
		
		if(e.shiftKey) {
			if( alldX+alldY > 0) {
				if( alldX < alldY ) {
					eclientX = fixPosX;					
				}
				else {
					eclientY = fixPosY;
				}				
			}
		}
		else {
			fixPosX = e.clientX; 
			fixPosY = e.clientY;
			alldX = 0;
			alldY = 0;
		}
		
		pos1 = pos3 - eclientX;
		pos2 = pos4 - eclientY;
		pos3 = eclientX;
		pos4 = eclientY;
		
		let newLeft = sizeSelGr.left - pos1;
		let newTop = sizeSelGr.top - pos2;

		newLeft = Math.max(0, Math.min(newLeft, img.width - (sizeSelGr.right-sizeSelGr.left) ));
		newTop = Math.max(0, Math.min(newTop, img.height - (sizeSelGr.bottom-sizeSelGr.top) ));
		
		let dxGr = newLeft - sizeSelGr.left; 
		let dyGr = newTop - sizeSelGr.top;
		
		if(dxGr !=0 ) {
			sizeSelGr.left += dxGr; 
			sizeSelGr.right += dxGr; 			
		}
		if(dyGr !=0 ) {			
			sizeSelGr.top += dyGr;
			sizeSelGr.bottom += dyGr;
		}
				
		const rectimg = img.getBoundingClientRect(); //Get real dimensions and position
		const imgWidth = rectimg.width; //Image width
		const imgHeight = rectimg.height; //Image height
		const imgLeft = rectimg.left; //image position by x
		const imgTop = rectimg.top; //Image Images by Y
		
		let els = document.querySelectorAll('.sio-rect.selected');
		for(i=0; i<els.length; ++i) {
			let rectSel = els[i];
			let posInSelX = parseFloat(rectSel.getAttribute('posInSelX') || 0);
			let posInSelY = parseFloat(rectSel.getAttribute('posInSelY') || 0);			
			
			rectSel.style.left = newLeft + posInSelX + 'px';
			rectSel.style.top = newTop + posInSelY + 'px';
			
			const trn = rectSel.style.transform;
			rectSel.style.transform = `rotate(0deg)`;
			const rect = rectSel.getBoundingClientRect(); //Get real dimensions and position
			const rectLeft = rect.left; //Position of a rectangle by x
			const rectTop = rect.top; //Position of a rectangle on y
			rectSel.style.transform = trn;
			const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;
			const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
			rectSel.style.left = `${leftPercent}%`;
			rectSel.style.top = `${topPercent}%`;			
		}

		wasDragElement = true; //dragged the element
	}
	

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
		if( oldcursor != '' &&  document.querySelectorAll('img')[0].style.cursor == 'move') {
			document.querySelectorAll('img')[0].style.cursor = oldcursor;
			//if(selectedRect) selectedRect.style.cursor = 'copy';
			if(selectedRect) selectedRect.classList.add('cursor-copy');
		}

		if( (creation_mode > 0 && creation_mode < 4) ) {			
			if(selectedRect) selectedRect.classList.remove('cursor-move');
		}

		document.querySelectorAll('.sio-rect.selected').forEach(rectSel => {
			rectSel.removeAttribute('posInSelX');
			rectSel.removeAttribute('posInSelY');					
		});

		document.querySelectorAll('.sio-rect').forEach(rectSel => {
			if(creation_mode != 0) {
				rectSel.classList.remove('cursor-move');
			}
			if( !(creation_mode >= 1 && creation_mode <= 3) ) {
				rectSel.classList.remove('cursor-copy');
			}
			if( creation_mode != 4 ) {
				rectSel.classList.remove('cursor-crosshair');
			}
		});
	}
}




// Function to recalculate offset back to global coordinates
function rotateToGlobal(dx, dy, angleRad) {
	if (angleRad == 0)
		return { x: dx, y: dy };
	else
		return {
			x: Math.cos(angleRad) * dx - Math.sin(angleRad) * dy,
			y: Math.sin(angleRad) * dx + Math.cos(angleRad) * dy
		};
}

function rotateToLocal(dx, dy, angleRad) {
    return {
        x: Math.cos(angleRad) * dx + Math.sin(angleRad) * dy,
        y: -Math.sin(angleRad) * dx + Math.cos(angleRad) * dy
    };
}


function makeResizable(element) {
	const handles = element.querySelectorAll('.resize-handle');
	handles.forEach(handle => {
		handle.onmousedown = resizeMouseDown;
	});

	function resizeMouseDown(e) {
		saveState();
		
		e.preventDefault();
		e.stopPropagation();
		const handle = e.target;
		const rect = element;
		rect.classList.remove('around-the-center');
		const isNW = handle.classList.contains('nw');
		const isNE = handle.classList.contains('ne');
		const isSW = handle.classList.contains('sw');
		const isSE = handle.classList.contains('se');

		if (isNW || isNE || isSW || isSE)
			disable_context_menu = true;

		let addcursormove = false;
		if(disable_context_menu) {
			addcursormove = rect.classList.contains('cursor-move');
			if(addcursormove) rect.classList.remove('cursor-move');
		}

		//if (e.buttons === 2 && !rect.classList.contains('line') ) { // right mouse button
		if (e.buttons === 2) { // right mouse button
			if(rect.classList.contains('line')) {
				rect.querySelector('.nw').classList.add('rotate');
				rect.querySelector('.se').classList.add('rotate');
			}
			else {
				rect.querySelector('.nw').classList.add('rotate');
				rect.querySelector('.sw').classList.add('rotate');
				rect.querySelector('.ne').classList.add('rotate');
				rect.querySelector('.se').classList.add('rotate');
			}
			
		}

		let startX = e.clientX;
		let startY = e.clientY;
		let startLeft = 0;
		let startTop = 0;
		let startWidth = 0;
		let startHeight = 0;
		let startCenterX = 0;  
		let startCenterY = 0;
		
		
		//transform relative coordinates to pixels
		let rectimg = img.getBoundingClientRect(); //Get real dimensions and position
		let imgWidth = rectimg.width; //Image width		
		let imgHeight = rectimg.height; //Image height
		let imgLeft = rectimg.left; //image position by x
		let imgTop = rectimg.top;//Image Images by Y	

		function moveOriginToCenter(rect) {
			const currentOrigin = rect.style.transformOrigin || "";
			if (
				currentOrigin === "center" ||
				currentOrigin === "center center"
			) {
				return;
			}

			// determine what the coordinates are currently stored in: px or %
			const leftRaw = rect.style.left || "0";
			const topRaw = rect.style.top || "0";
			const isPercentLeft = leftRaw.includes("%");
			const isPercentTop = topRaw.includes("%");
			let leftValue = parseFloat(leftRaw) || 0;
			let topValue = parseFloat(topRaw) || 0;

			// we guarantee starting condition
			rect.style.transformOrigin = "0 0";
			let before;
			let after;

			try {
				before = rect.getBoundingClientRect();
				rect.style.transformOrigin = "center";
				after = rect.getBoundingClientRect();

				// fallback if the browser returned something strange
				if (
					!before ||
					!after ||
					!isFinite(before.left) ||
					!isFinite(before.top) ||
					!isFinite(after.left) ||
					!isFinite(after.top)
				) {
					throw new Error("bad rect values");
				}
			} catch (e) {
				console.log("moveOriginToCenter fallback:", e);
				rect.style.transformOrigin = "center";
				rect.classList.add('around-the-center');
				return;
			}

			const diffX = before.left - after.left;
			const diffY = before.top - after.top;
			
			// if left/top were in %
			if (isPercentLeft) {
				leftValue += (diffX / imgWidth) * 100;
				rect.style.left = `${leftValue}%`;
			} else {
				leftValue += diffX;
				rect.style.left = `${leftValue}px`;
			}

			if (isPercentTop) {
				topValue += (diffY / imgHeight) * 100;
				rect.style.top = `${topValue}%`;
			} else {
				topValue += diffY;
				rect.style.top = `${topValue}px`;
			}
			rect.classList.add('around-the-center');
		}


		function moveOriginToTopLeft(rect) {
			const currentOrigin = rect.style.transformOrigin || "";
			if (
				currentOrigin !== "center" &&
				currentOrigin !== "center center"
			) {
				return;
			}

			const leftRaw = rect.style.left || "0";
			const topRaw = rect.style.top || "0";
			const isPercentLeft = leftRaw.includes("%");
			const isPercentTop = topRaw.includes("%");
			let leftValue = parseFloat(leftRaw) || 0;
			let topValue = parseFloat(topRaw) || 0;
			rect.style.transformOrigin = "center";
			let before;
			let after;

			try {
				before = rect.getBoundingClientRect();
				rect.style.transformOrigin = "0 0";
				after = rect.getBoundingClientRect();
				if (
					!before ||
					!after ||
					!isFinite(before.left) ||
					!isFinite(before.top) ||
					!isFinite(after.left) ||
					!isFinite(after.top)
				) {
					throw new Error("bad rect values");
				}
			} catch (e) {	
				console.log("moveOriginToTopLeft fallback:", e);			
				rect.style.transformOrigin = "0 0";
				rect.classList.remove('around-the-center');
				return;
			}

			const diffX = before.left - after.left;
			const diffY = before.top - after.top;
			
			if (isPercentLeft) {
				leftValue += (diffX / imgWidth) * 100;
				rect.style.left = `${leftValue}%`;
			} else {
				leftValue += diffX;
				rect.style.left = `${leftValue}px`;
			}

			if (isPercentTop) {
				topValue += (diffY / imgHeight) * 100;
				rect.style.top = `${topValue}%`;
			} else {
				topValue += diffY;
				rect.style.top = `${topValue}px`;
			}
			rect.classList.remove('around-the-center');
		}


		if(e.buttons === 2) {			
			let orCenter = rect.style.transformOrigin.includes('center');
			if( orCenter != e.altKey ) {
				if( e.altKey ) moveOriginToCenter(rect);
				else moveOriginToTopLeft(rect);				
			}		
		}

		//we get the coordinates that would occupy a rectangle if they would not turn
		const trn = rect.style.transform;
		rect.style.transform = `rotate(0deg)`;
		const rectEl = rect.getBoundingClientRect(); //Get real dimensions and position
		startWidth = rectEl.width; //The width of the rectangle
		startHeight = rectEl.height; //The height of the rectangle
		startLeft = rectEl.left; //Position of a rectangle by x
		startTop = rectEl.top; //Position of a rectangle on y
		startCenterX = startLeft +  startWidth / 2.0;  
		startCenterY = startTop + startHeight / 2.0;

		let newWidth = startWidth, newHeight = startHeight, newLeft = startLeft, newTop = startTop;

		rect.style.transform = trn;
		rect.style.left = startLeft - imgLeft + "px";
		rect.style.top = startTop - imgTop + "px";
		rect.style.width = startWidth + "px";
		rect.style.height = startHeight + "px";
		let startMouseAngleRad = Math.atan2(e.clientY - startTop, e.clientX - startLeft);
		const match = rect.style.transform.match(/rotate\(([-\d.]+)deg\)/);
		startAngle = match ? parseFloat(match[1]) : 0;

		if(e.buttons === 2) {
			//rect = element;
			const angleForCSS = Math.round(-startAngle * 10) / 10;
			rect.querySelector('.nw.rotate').style.setProperty("--angle-text", `"⟳ ${angleForCSS}°"`);
		}
		
		document.onmousemove = elementResize;
		document.onmouseup = closeResizeElement;


		function elementResize(e) {
			e.preventDefault();			
			// We can calculate the difference (delta) of the change in coordinate X and the coordinate y coordinate
			let dx = e.clientX - startX;
			let dy = e.clientY - startY;		
			
			let trn = rect.style.transform;			
			const match = trn.match(/rotate\(([-\d.]+)deg\)/)
			let angle = 0;
			if (match) angle = parseFloat(match[1]);
			let angleRad = (angle * Math.PI) / 180; // We convert the angle of degrees into radian
			if (Math.abs(angleRad) < 0.008) { // An angle less than half a degree is considered zero
				angleRad = 0;
				rect.style.transform = "";
			}

			let { x: localDX, y: localDY } = rotateToLocal(dx, dy, angleRad);
			
			const isLine = rect.classList.contains('line');			
			if( !isLine || (e.buttons === 2 && isLine) ) {			
				if (e.buttons === 1) { // left mouse button
					let rawLeft = startLeft;
					let rawTop = startTop;		
					let rawLeft2 = rawLeft + startWidth;  
					let rawTop2 = rawTop + startHeight;  

					if (isNW) {					
						rawLeft += localDX;
						rawTop += localDY;											
					}
					else if (isNE) {						
						rawLeft2 += localDX;
						rawTop += localDY;												
					}
					else if (isSW) {						
						rawLeft += localDX;
						rawTop2 += localDY;						
					}
					else if (isSE) {	
						rawLeft2 += localDX;
						rawTop2 += localDY;																
					}

					newWidth = Math.abs(rawLeft2 - rawLeft); 
					newHeight = Math.abs(rawTop2 - rawTop); 									

					if( (e.shiftKey && newWidth != newHeight) || e.ctrlKey ) {
						let dw = 0, dh = 0;
						if( (e.shiftKey && newWidth != newHeight) && !isLine ) {
								if(newWidth > newHeight) {
								dh = newWidth - newHeight;
								newHeight = newWidth;
							}
							else {
								dw = newHeight - newWidth;  
								newWidth = newHeight;
							}
						}
						if(e.ctrlKey) {							
							let stepSc = isScaled200 ? 20 : 10;							
							let r_width = Math.round(newWidth/stepSc)*stepSc;   
							let r_height = Math.round(newHeight/stepSc)*stepSc;
							dw += r_width - newWidth;
							dh += r_height - newHeight;
							newWidth = r_width;
							newHeight = r_height;
						}						

						if (isNW) {		
							if(e.altKey) {
								rawLeft -= dw/2.0;
								rawTop -= dh/2.0;
							}
							else {
								rawLeft -= dw;
								rawTop -= dh;
							}							
						}
						else if (isNE) {
							if(e.altKey) {
								rawTop -= dh/2.0;
							}
							else {
								rawTop -= dh;
							}
						}
						else if (isSW) {
							if(e.altKey) {
								rawLeft -= dw/2.0;
							}
							else {
								rawLeft -= dw;
							}							
						}		
						else if (isSE) {											
						}										
					}

					if(e.altKey) {						
						rawLeft = startCenterX - newWidth / 2.0;
						rawTop = startCenterY - newHeight / 2.0;
					}			

					// Transformer en coordonnées globales
					const rotatedOffset = rotateToGlobal(rawLeft - startLeft, rawTop - startTop, angleRad);
					newLeft = startLeft + rotatedOffset.x;
					newTop = startTop + rotatedOffset.y;
					
					rect.style.width = newWidth + 'px';					
					rect.style.height = newHeight + 'px';
					rect.style.left = newLeft - imgLeft + 'px';				
					rect.style.top = newTop - imgTop + 'px';
					
					const trn = rect.style.transform;
					rect.style.transform = `rotate(0deg)`;
					const rect0 = rect.getBoundingClientRect(); //Get real dimensions and position
					const rectWidth = rect0.width; //The width of the rectangle
					const rectHeight = rect0.height; //The height of the rectangle
					const rectLeft = rect0.left; //Position of a rectangle by x
					const rectTop = rect0.top; //Position of a rectangle on y
					rect.style.transform = trn;

					const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;					
					const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
					const widthPercent = (rectWidth / imgWidth) * 100;
					const heightPercent = (rectHeight / imgHeight) * 100;

					rect.style.left = `${leftPercent}%`;
					rect.style.top = `${topPercent}%`;
					rect.style.width = `${widthPercent}%`;
					if ( isLine ) {
						rect.style.height = "2px";
					}
					else {
						rect.style.height = `${heightPercent}%`;												
					}

				}
				else if (e.buttons === 2) { // right mouse button

					let orCenter = rect.style.transformOrigin.includes('center');
					if( orCenter != e.altKey ) {
						if( e.altKey ) moveOriginToCenter(rect);
						else moveOriginToTopLeft(rect);				
					}

					const rdx = e.clientX - startLeft;
					const rdy = e.clientY - startTop;

					// angle between the rotation point and the current mouse position
					const currentAngleRad = Math.atan2(rdy, rdx);
					const deltaAngleRad = currentAngleRad - startMouseAngleRad;

					let newAngleDeg = startAngle + deltaAngleRad * (180 / Math.PI);

					// rotation steps
					if (e.shiftKey) { // step 15deg
						const step = 15;
						newAngleDeg = Math.round(newAngleDeg / step) * step;
					}
					
					const angleForCSS = Math.round(-newAngleDeg * 10) / 10;
					rect.querySelector('.nw.rotate').style.setProperty("--angle-text", `"⟳ ${angleForCSS}°"`);
					
					rect.style.transform = `rotate(${newAngleDeg}deg)`;
					const trn = rect.style.transform;

					rect.style.transform = `rotate(0deg)`;

					const rect0 = rect.getBoundingClientRect();
					const rectWidth = rect0.width;
					const rectHeight = rect0.height;
					const rectLeft = rect0.left;
					const rectTop = rect0.top;

					rect.style.transform = trn;

					const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;
					const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
					const widthPercent = (rectWidth / imgWidth) * 100;
					const heightPercent = (rectHeight / imgHeight) * 100;

					rect.style.left = `${leftPercent}%`;
					rect.style.top = `${topPercent}%`;
					rect.style.width = `${widthPercent}%`;

					if (isLine)
						rect.style.height = "2px";
					else
						rect.style.height = `${heightPercent}%`;
				}

			}
			else { // line
				// if you move behind some angle
				if(isNE || isSE || isNW || isSW) {	
					// We can calculate the difference (delta) of the change in coordinate X and the coordinate y coordinate
					let dx = e.clientX - startX;
					let dy = e.clientY - startY;
					startX = e.clientX; 
					startY = e.clientY;
					let trn = rect.style.transform;	
					const match = trn.match(/rotate\(([-\d.]+)deg\)/)
					let angle = 0;
					if(match) angle = parseFloat(match[1]);	

					if (e.buttons === 2) { // right mouse button
						if(e.shiftKey) { // step 15deg
							const step = 15;
							angle = Math.round(angle / step) * step;
						}
					}
					

					const angleRad = (angle * Math.PI) / 180; // We convert the angle of degrees into radian
								
					//But because of the different rect.Style.transform = `Rotate ($ {angle} Deg)`; We need to somehow calculate 
					//as this change will affect and change both the length and the angle of the RECT
					let width = parseFloat(rect.style.width); 
					let left = parseFloat(rect.style.left);
					let top = parseFloat(rect.style.top);
					let height = parseFloat(rect.style.height);	
					let rectX2, rectY2;
					//Calculate the final coordinates
					rectX2 = left + width * Math.cos(angleRad);
					rectY2 = top + width * Math.sin(angleRad);

					if(isNE || isSE) {
						// Change the final coordinates to dx and dy
						rectX2 += dx;
						rectY2 += dy;
					}
					else if(isNW || isSW) {	
						// Change the initial coordinates
						left += dx;
						top += dy;
					}

					let newWidth = Math.sqrt((rectX2 - left) ** 2 + (rectY2 - top) ** 2);
					// We calculate the new angle (angle) in radiates, then convert into degrees
					const newAngleRad = Math.atan2(rectY2 - top, rectX2 - left);
					let newAngle = (newAngleRad * 180) / Math.PI;
					if (e.buttons === 2) { // right mouse button						
						if(e.shiftKey && e.altKey) { // step 5deg
							const step = 5;
							newAngle = Math.round(newAngle / step) * step;
						}
						else if(e.shiftKey) { // step 15deg
							const step = 15;
							newAngle = Math.round(newAngle / step) * step;
						}
						else if(e.ctrlKey) { // step 10deg
							const step = 10;
							newAngle = Math.round(newAngle / step) * step;
						}

						const angleForCSS = Math.round(-newAngle * 10) / 10;
						rect.querySelector('.nw.rotate').style.setProperty("--angle-text", `"⟳ ${angleForCSS}°"`);
					}
					else if (e.buttons === 1) { // left mouse button
						if(e.ctrlKey) {
							let stepSc = isScaled200 ? 20 : 10;
							newWidth = Math.round(newWidth/stepSc)*stepSc;   							
						}
					}
					
					// We update the style of the element
					rect.style.left = `${left}px`;
					rect.style.top = `${top}px`;
					rect.style.width = `${newWidth}px`;
					if(height < 2) height = 2;
					rect.style.height = `${height}px`; // 2px
					rect.style.transform = `rotate(${newAngle}deg)`;
				}
			}
			

			wasDragElement = true;
		}


		function closeResizeElement() {
			document.onmousemove = null;
			document.onmouseup = null;

			let orCenter = rect.style.transformOrigin.includes('center');
			if(orCenter) moveOriginToTopLeft(rect);
			rect.style.transformOrigin = '';
			rect.classList.remove('around-the-center');

			rect.querySelector('.nw').classList.remove('rotate');
			rect.querySelector('.sw').classList.remove('rotate');
			rect.querySelector('.ne').classList.remove('rotate');
			rect.querySelector('.se').classList.remove('rotate');

			if(addcursormove) rect.classList.add('cursor-move');


			// count in proportional coordinates
			if( rect.classList.contains('line') ) {	
				const trn = rect.style.transform; 
				rect.style.transform = `rotate(0deg)`;
				const rect0 = rect.getBoundingClientRect(); //Get real dimensions and position
				const rectWidth = rect0.width; //The width of the rectangle
				const rectHeight = rect0.height; //The height of the rectangle
				const rectLeft = rect0.left; //Position of a rectangle by x
				const rectTop = rect0.top; //Position of a rectangle on y
				rect.style.transform = trn; 

				const leftPercent = ((rectLeft-imgLeft)/imgWidth)*100;
				const topPercent = ((rectTop-imgTop)/imgHeight)*100;
				const widthPercent = (rectWidth / imgWidth) * 100;
				const heightPercent = (rectHeight / imgHeight) * 100;

				rect.style.left = `${leftPercent}%`;
				rect.style.top = `${topPercent}%`;
				rect.style.width = `${widthPercent}%`;
				rect.style.height = "2px";
			}

			
			setTimeout(() => {
				disable_context_menu = false;
			}, 250);
		}

	}

}



//Editing text in a rectangle
function editText() {
	if (selectedRect) {
		updateResize();
		const textDiv = selectedRect.querySelector('.txt-sio-rect');
		//if (!textDiv.parentElement.classList.contains('hiding') && !textDiv.parentElement.classList.contains('line')) {
		if ( !textDiv.parentElement.classList.contains('line') ) {
			//if already edited, then make it transparent
			if (textDiv.classList.contains('text-editable')) {
				selectedRect.classList.add('transparent');
				textDiv.classList.remove('text-editable');
				selectedRect.classList.remove('text-editing'); //Remove the class of editing mode
			}
			else {
				textDiv.contentEditable = true;
				textDiv.classList.add('text-editable');
				selectedRect.classList.add('text-editing'); //Add a class for editing
				selectedRect.classList.remove('transparent');
				textDiv.focus();
				setCursorToEnd(textDiv);
			}
		}
	}
}


function addClickHandlers(element) {
	// Add an Input e processor to tell in red if only one is introduced:
	element.oninput = function (e) {
		const text = element.textContent;
		if (text.includes('::')) {
			element.style.color = 'black';
		} else if (text.includes(':')) {
			element.style.color = 'red';
		} else {
			element.style.color = 'black';
		}
	};

	element.onpaste = function (e) {	// When inserting only the text leave the text
		e.preventDefault();
		const text = (e.clipboardData || window.clipboardData).getData('text');
		// document.execCommand('insertText', false, text); OLD
		const selection = window.getSelection();
		if (!selection.rangeCount) return;
		const range = selection.getRangeAt(0);
		range.deleteContents();
		range.insertNode(document.createTextNode(text));
	};

	element.onclick = function (e) {
		e.stopPropagation();
		if (wasDragElement) { //dragged the element so that nothing to do
			wasDragElement = false;
			return;
		}
		
		const textDiv = element.querySelector('.txt-sio-rect');
		let issel = element.classList.contains('selected');
		if (textDiv.isContentEditable) {
			if (element != selectedRect) {
				document.querySelectorAll('.sio-rect').forEach(rect => {
					if(!e.shiftKey) {
						rect.classList.remove('selected');
					}					
				});
				
				if(issel && e.shiftKey) {
					element.classList.remove('selected');
					selectedRect = null;
					document.querySelectorAll('.sio-rect').forEach(rect => {
						rect.classList.remove('selectedRect');
					});
					if(selectedRect != null) selectedRect.classList.add('selectedRect');
				}
				else {
					element.classList.add('selected');
					selectedRect = element;
					document.querySelectorAll('.sio-rect').forEach(rect => {
						rect.classList.remove('selectedRect');
					});
					if(selectedRect != null) selectedRect.classList.add('selectedRect');
				}				
				// if(selectedRect && !selectedRect.classList.contains('selected')) selectedRect = null;
			}
			return;
		}
		

		document.querySelectorAll('.sio-rect').forEach(rect => {
			if(!e.shiftKey) {
				rect.classList.remove('selected');
			}			
		});

		
		if(issel && e.shiftKey) {
			element.classList.remove('selected');
			selectedRect = null;
			document.querySelectorAll('.sio-rect').forEach(rect => {
				rect.classList.remove('selectedRect');
			});
			if(selectedRect != null) selectedRect.classList.add('selectedRect');
		}
		else {
			element.classList.add('selected');
			selectedRect = element;
			document.querySelectorAll('.sio-rect').forEach(rect => {
				rect.classList.remove('selectedRect');
			});
			if(selectedRect != null) selectedRect.classList.add('selectedRect');
		}
		
		if ( !element.classList.contains("line") && e.ctrlKey ) {
			const isTransparent = element.classList.contains('transparent');
			if (isTransparent) element.classList.remove('transparent');
			else element.classList.add('transparent');
		}
	};

	element.ondblclick = function (e) {
		if (e.target.className.includes('resize-handle') || e.target.className.includes('font-buttons')) return;
		e.stopPropagation();
		const textDiv = element.querySelector('.txt-sio-rect');
		//if (!textDiv.isContentEditable && !textDiv.parentElement.classList.contains('hiding')) {
		if (!textDiv.isContentEditable && !textDiv.parentElement.classList.contains('hiding')) {
			textDiv.contentEditable = true;
			textDiv.classList.add('text-editable');
			element.classList.add('text-editing');//Add a class for editing		
			textDiv.focus();
		}
	};

	element.querySelector('.txt-sio-rect').onblur = function () {
		const textDiv = element.querySelector('.txt-sio-rect');
		if (element.classList.contains('text-editing')) return;
		textDiv.contentEditable = false;
		textDiv.classList.remove('text-editable');
		element.classList.remove('text-editing'); //Remove the class of editing mode			
	};
}

//Show / Hide a rectangle
function showhideRectangle() {
	let isTransparent = null;
	if (selectedRect) {
		isTransparent = selectedRect.classList.contains('transparent');
	}	

	document.querySelectorAll('.sio-rect.selected:not(.line)').forEach(rect => {
		if(isTransparent == null) isTransparent = rect.classList.contains('transparent');
		if(isTransparent) rect.classList.remove('transparent');
		else rect.classList.add('transparent'); 
	});
}


// show / hide all rectangles
function showhideAllRectangle() {
	let element = document.querySelectorAll('.sio-rect:not(.line)')[0];
	if (element) {
		const isTransparent = element.classList.contains('transparent');
		if (isTransparent) {
			showAllRectangle();
		}
		else {
			hideAllRectangle();			
		}
	}
	else {
		showAllRectangle();
	}
}


// Hide all rectangles
function hideAllRectangle() {
	document.querySelectorAll('.sio-rect').forEach(rect => {			
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
		if (!rect.classList.contains("line"))
			rect.classList.add('transparent');
	});	
}


//Show all the rectangles
function showAllRectangle() {
	document.querySelectorAll('.sio-rect').forEach(rect => {				
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
		rect.classList.remove('transparent');
	});	
}


//discharge of discharge when clicking on the container
containerImg.onclick = function (e) {
	e.stopPropagation();
	document.querySelectorAll('.sio-rect').forEach(rect => {
		if(creation_mode!=4 || creation_mode==0) rect.classList.remove('selected');		
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
	});
	document.querySelectorAll('.txt-sio-rect.text-editable').forEach(rect => {
		rect.classList.remove('text-editable');
		rect.contentEditable = false;
		rect.parentElement.classList.remove('text-editing'); //Remove the class of editing mode		
	});
	selectedRect = null;
	document.querySelectorAll('.sio-rect').forEach(rect => {
		rect.classList.remove('selectedRect');
	});
	if(selectedRect != null) selectedRect.classList.add('selectedRect');
};

// aligning selected rectangles to the outermost or all to the same width or height
function alignSelectedRect(command) {
	if(creation_mode != 4 && creation_mode != 0) return;

	saveState();

	const els = document.querySelectorAll('.sio-rect.selected');
	if(els.length > 1 && selectedRect != null) {		
		const left = selectedRect.style.left;
		const top = selectedRect.style.top;
		const width = selectedRect.style.width;
		const height = selectedRect.style.height;	
		const transform = selectedRect.style.transform;
		for(i=0; i < els.length; ++i) {
			rect = els[i];
			if(rect == selectedRect) continue;

			if(command=='L') {
				rect.style.left = left;
			}
			else if(command=='T') {
				rect.style.top = top; 
			}
			else if(command=='W') {
				rect.style.width = width; 
			}
			else if(command=='H') {
				rect.style.height = height; 
			}
			else if(command=='R') {
				rect.style.transform = transform; 
			}
		}
	}	
}

// Change the form
function rectangleToRound() {
	saveState();
	document.querySelectorAll('.sio-rect.selected').forEach(rect => {
		const textDiv = rect.querySelector('.txt-sio-rect');
		par = textDiv.parentElement;		
		if (par.classList.contains('line')) {
			if (par.classList.contains('notvisible')) {
                par.classList.remove('notvisible');     
				formn3 = 0;           
            }
			else {
                par.classList.add('notvisible');  
				formn3 = 1;              
            }
		}
		else {
			if (par.classList.contains('round')) {
                par.classList.remove('round');	
				if(par.classList.contains('hiding')) formn2 = 0;
				else formn1 = 0;
            }
			else {
                par.classList.add('round');   
				if(par.classList.contains('hiding')) formn2 = 1;
				else formn1 = 1;             
            }
		}		
	});

	if(selectedRect != null) {
		const textDiv = selectedRect.querySelector('.txt-sio-rect');
		textDiv.focus();
	}
}


function scale200() {
    const isScaled = containerImg.classList.contains('scale200');	 

    let sizeSelGr = {
        left: null,
        top: null,
        right: null,
        bottom: null
    };

    const rectimg = img.getBoundingClientRect();
    const imgWidth = rectimg.width;
    const imgHeight = rectimg.height;

    let els = document.querySelectorAll('.sio-rect.selected');

    for (let i = 0; i < els.length; ++i) {
        let rectSel = els[i];

        if (sizeSelGr.left == null || sizeSelGr.left > rectSel.offsetLeft)
            sizeSelGr.left = rectSel.offsetLeft;

        if (sizeSelGr.top == null || sizeSelGr.top > rectSel.offsetTop)
            sizeSelGr.top = rectSel.offsetTop;

        if (sizeSelGr.right == null || sizeSelGr.right < (rectSel.offsetLeft + rectSel.offsetWidth))
            sizeSelGr.right = rectSel.offsetLeft + rectSel.offsetWidth;

        if (sizeSelGr.bottom == null || sizeSelGr.bottom < (rectSel.offsetTop + rectSel.offsetHeight))
            sizeSelGr.bottom = rectSel.offsetTop + rectSel.offsetHeight;
    }

    if (isScaled) {
        // save current 200% scroll
        scroll200.left = scrollContainer.scrollLeft;
        scroll200.top = scrollContainer.scrollTop;

        containerImg.classList.remove('scale200');
        scale200Btn.innerText = '200%';

        // restore 100%
        scrollContainer.scrollLeft = scroll100.left;
        scrollContainer.scrollTop = scroll100.top;
    }
    else {
        // save current 100% scroll
        scroll100.left = scrollContainer.scrollLeft;
        scroll100.top = scrollContainer.scrollTop;

        containerImg.classList.add('scale200');
        scale200Btn.innerText = '100%';

        if (els.length === 0) {
            // restore saved 200%
            scrollContainer.scrollLeft = scroll200.left;
            scrollContainer.scrollTop = scroll200.top;
        }
        else {         
            const groupCenterX = ((sizeSelGr.left + sizeSelGr.right) / 2) * 2;
            const groupCenterY = ((sizeSelGr.top + sizeSelGr.bottom) / 2) * 2;            
            const viewportCenterX = scrollContainer.clientWidth / 2;
            const viewportCenterY = scrollContainer.clientHeight / 2;
            let targetScrollLeft = groupCenterX - viewportCenterX;
            let targetScrollTop = groupCenterY - viewportCenterY;
            // overshoot protection
            targetScrollLeft = Math.max(
                0,
                Math.min(
                    targetScrollLeft,
                    scrollContainer.scrollWidth - scrollContainer.clientWidth
                )
            );
            targetScrollTop = Math.max(
                0,
                Math.min(
                    targetScrollTop,
                    scrollContainer.scrollHeight - scrollContainer.clientHeight
                )
            );

            scrollContainer.scrollLeft = targetScrollLeft;
            scrollContainer.scrollTop = targetScrollTop;
        }
    }

	
	isScaled200 = containerImg.classList.contains('scale200');
    updateResize();
}



//Change the type of rectangle
function exchangeRectangle() {
	saveState();
	document.querySelectorAll('.sio-rect.selected').forEach(rect => {
		const textDiv = rect.querySelector('.txt-sio-rect');
		par = textDiv.parentElement;
		//const isTransparent = par.classList.contains('transparent');	
		if (par.classList.contains('hiding')) par.classList.remove('hiding');
		else par.classList.add('hiding');		
	});

	if(selectedRect != null) {
		const textDiv = selectedRect.querySelector('.txt-sio-rect');
		textDiv.focus();
	}
}

//Discharge of discharge when clicking outside the container
document.onclick = function (e) {
	if (!containerImg.contains(e.target)
		&& !addBtn.contains(e.target) && !removeBtn.contains(e.target) && !editTextBtn.contains(e.target) && !exchangeBtn.contains(e.target)
		&& !add2Btn.contains(e.target) && !addLine.contains(e.target) && !roundBtn.contains(e.target)
	) {
		document.querySelectorAll('.sio-rect').forEach(rect => {
			//rect.classList.remove('selected');			
			rect.classList.remove('text-editable');
			rect.classList.remove('text-editing');
		});
		document.querySelectorAll('.txt-sio-rect.text-editable').forEach(rect => {
			rect.classList.remove('text-editable');
			rect.contentEditable = false;
			rect.parentElement.classList.remove('text-editing'); //Remove the class of editing mode			
		});
		selectedRect = null;
		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.remove('selectedRect');
		});
		if(selectedRect != null) selectedRect.classList.add('selectedRect');
	}
};


function initializeRectangles() {
	// Find all the existing rectangles and add the handlers
	document.querySelectorAll('.sio-rect').forEach(rect => {
		makeDraggable(rect);
		makeResizable(rect);
		addClickHandlers(rect);
	});	
}

// disable context menu
document.addEventListener('contextmenu', function (e) {
	//e.preventDefault(); // Blocks the context menu 
	if (disable_context_menu) {
		e.preventDefault(); // Blocks the context menu 
	}
});

// Call the function after loading the document
document.addEventListener('DOMContentLoaded', initializeRectangles);



function getCharCoef(fontFamily) {
    const span = document.createElement("span");
    span.classList.add('sio-rect');
    span.classList.add('transparent');
    span.classList.add('wordshow');
    span.style.visibility = "hidden";
    span.style.fontFamily = fontFamily;
    span.style.letterSpacing = '0.07em';
    span.style.fontSize = "64px";
    span.textContent = "NNNNNNN";
    document.body.appendChild(span);
    const width = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    return width / (6 * 64);
}

var charWidthCoef = 0.7; // 0.6 not in the editor
elSR = document.querySelectorAll('.txt-sio-rect')[0];
if(elSR) {
    const fontFamily = getComputedStyle(elSR).fontFamily;
    charWidthCoef = getCharCoef(fontFamily);  
	charWidthCoef += 0.1; // in the editor 
}


function fitFontSizeToRect(rectElement) {
    let txt = rectElement.textContent || "";
    let word = rectElement.getAttribute('word') || "";
    let hint = rectElement.getAttribute('hint') || "";

    if (txt.length === 0 && hint.length > word.length) txt = hint;
    else if (word.length > txt.length) txt = word;

    let pz = txt.indexOf("::");
    if (pz > 0) txt = txt.slice(0, pz);

    const rect = rectElement.getBoundingClientRect();
    const rectWidth = rect.width;
    const rectHeight = rect.height;

    let len = txt.length || 1;
    
    let fontSize;

	if (len <= 4) len = 4;	
   	if (len <= 15) {
        // 1 line
        const byWidth = rectWidth / (len * charWidthCoef);
        const byHeight = rectHeight * 0.8;

        fontSize = Math.min(byWidth, byHeight);
    } else {
        // 2 line
        const charsPerLine = Math.ceil(len / 2);

        const byWidth = rectWidth / (charsPerLine * charWidthCoef);
        const byHeight = rectHeight / 2;

        fontSize = Math.min(byWidth, byHeight);
    }
    	
    let minPx = 16; // 10 not in the editor
	fontSize = Math.max(minPx, Math.min(fontSize, 100));

    rectElement.style.fontSize = fontSize + "px";
}

// Update the size of the font from the size of the image container
function updateFontSize() {    
    els = document.querySelectorAll('.txt-sio-rect');
    for (var i = 0; i < els.length; i++) {
        try {
            fitFontSizeToRect(els[i]);        
        } catch(err) {}        
    }
}

var fontSizeTimer = null;

function updateResize() {
    if(fontSizeTimer) {
        clearTimeout(fontSizeTimer);
    }
    fontSizeTimer = setTimeout(() => {
        updateFontSize();
    }, 0)
}

function updateScroll() {
    if(fontSizeTimer) {
        clearTimeout(fontSizeTimer);
    }
    fontSizeTimer = setTimeout(() => {
        updateFontSize();
    }, 0)
}


if (window.visualViewport) {
	visualViewport.addEventListener('resize', updateResize);
	visualViewport.addEventListener('scroll', updateScroll);
} 
else {
	window.addEventListener('resize', updateResize);
	window.addEventListener('scroll', updateScroll);
}


setTimeout(() => {
        const container = document.querySelector('.sio-container');
        if (!container) return;
    
        const doc = document.scrollingElement;
    
        let isDown = false;
        let startX, startY;
        let scrollLeft, scrollTop;   
		let oldcursor = '';
    
        document.addEventListener('mouseup', () => {
			if( isDown && document.querySelectorAll('img')[0].style.cursor == 'grab' )
				document.querySelectorAll('img')[0].style.cursor = oldcursor;

			isDown = false;
        });
        
        container.addEventListener('mousedown', (e) => {	
			

			if (creation_mode != 0) return;
            if (e.target.closest('.sio-rect')) return;
        
            e.preventDefault();
        
            isDown = true;
        
            startX = e.clientX;
            startY = e.clientY;        
            
			scrollLeft = doc.scrollLeft;
            scrollTop = doc.scrollTop;

			oldcursor = document.querySelectorAll('img')[0].style.cursor;
			document.querySelectorAll('img')[0].style.cursor = 'grab';
        });
        
        
        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
        
            e.preventDefault();
        
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
                    
			doc.scrollLeft = scrollLeft - dx;
            doc.scrollTop = scrollTop - dy;
        });
                
    }, 0);
	




function project(verts, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const v of verts) {
        const dot = v.x * axis.x + v.y * axis.y;
        if (dot < min) min = dot;
        if (dot > max) max = dot;
    }

    return { min, max };
}

function getAxes(verts) {
    const axes = [];

    for (let i = 0; i < 2; i++) {
        const p1 = verts[i];
        const p2 = verts[i + 1];

        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };

        // normal
        axes.push({
            x: -edge.y,
            y: edge.x
        });
    }

    return axes;
}



function sat(a, b) {

    const axes = [
        ...getAxes(a.verts),
        ...getAxes(b.verts)
    ];

    for (const axis of axes) {
        const len = Math.hypot(axis.x, axis.y);
        const n = { x: axis.x / len, y: axis.y / len };
        const p1 = project(a.verts, n);
        const p2 = project(b.verts, n);
		
        if (p1.max < p2.min || p2.max < p1.min) {
            return false;
        }
    }

    return true;
}



function percentToPx(el, img) {
    const imgRect = img.getBoundingClientRect();

    const left = parseFloat(el.style.left);
    const top = parseFloat(el.style.top);
    const width = parseFloat(el.style.width);
    const height = parseFloat(el.style.height);

    const x = imgRect.left + (left / 100) * imgRect.width;
    const y = imgRect.top + (top / 100) * imgRect.height;
    const w = (width / 100) * imgRect.width;
    const h = (height / 100) * imgRect.height;

    const match = el.style.transform.match(/rotate\(([-\d.]+)deg\)/);
    const angle = match ? parseFloat(match[1]) : 0;
    const rad = angle * Math.PI / 180;

    const px = x;
    const py = y;

    const local = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h }
    ];

    const verts = local.map(p => {
        const rx = p.x * Math.cos(rad) - p.y * Math.sin(rad);
        const ry = p.x * Math.sin(rad) + p.y * Math.cos(rad);

        return {
            x: px + rx,
            y: py + ry
        };
    });

    return { verts };
}


function getRectsHTML() {
    const container = document.querySelector('.sio-image-container');
    return [...container.querySelectorAll('.sio-rect')]
        .map(el => el.outerHTML)
        .join('');
}

function saveState() {
    undoStack.push(getRectsHTML());
    redoStack.length = 0;	
}

function undo() {	
    if (undoStack.length === 0) return;
    const container = document.querySelector('.sio-image-container');
    // current state → in redo
    redoStack.push(getRectsHTML());
    const prev = undoStack.pop();
    restoreRects(container, prev);
}


function redo() {
    if (redoStack.length === 0) return;
    const container = document.querySelector('.sio-image-container');
    // current state → in undo
    undoStack.push(getRectsHTML());
    const next = redoStack.pop();
    restoreRects(container, next);
}



function restoreRects(container, html) {
    // we delete only rects
    container.querySelectorAll('.sio-rect').forEach(el => el.remove());	
    // insert new ones
    container.insertAdjacentHTML('beforeend', html);
    reinit();
}


function reinit() {	
	initializeRectangles();	
}