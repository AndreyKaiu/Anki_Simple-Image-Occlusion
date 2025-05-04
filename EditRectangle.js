// -*- coding: utf-8 -*-
// add-on for anki program "Simple Image Occlusion" 
// https://github.com/AndreyKaiu/Anki_Simple-Image-Occlusion
// Version 1.0, date: 2025-05-04
var creation_mode = 0; // rectangle creation mode
var disable_context_menu = false;
const containerImg = document.getElementsByClassName('sio-image-container')[0];
const img = document.getElementsByClassName('sio-image')[0];
const addBtn = document.getElementById('addBtn');
const removeBtn = document.getElementById('removeBtn');
const add2Btn = document.getElementById('add2Btn');
const addLine = document.getElementById('addLine');
const exchangeBtn = document.getElementById('exchangeBtn');
var selectedRect = null;

var startX, startY; // Initial coordinates
var isDrawing = false; // Flag to track drawing
var wasDragElement = false; // dragged element


let isMouseClick = false; // Flag for tracking mouse click

// Track mouse click
document.addEventListener('mousedown', () => {
	isMouseClick = true;
});

// Reset the flag after click processing is complete
document.addEventListener('mouseup', () => {
	isMouseClick = false;
});


// Disable image dragging
img.addEventListener('dragstart', function (e) {
	e.preventDefault(); // Override default drag behavior
});


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

document.addEventListener('keydown', function (event) {
	if (event.key === 'Enter' || event.key === 'Tab') {
		event.preventDefault(); // Prevent default behavior

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

		// We go to the next element or return to the first
		const nextIndex = (currentIndex + 1) % rectangles.length;
		const nextRectangle = rectangles[nextIndex];

		nextRectangle.contentEditable = true;
		nextRectangle.classList.add('text-editable');
		selectedRect = nextRectangle.parentElement;
		selectedRect.classList.add('selected');
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
	document.querySelectorAll('img')[0].style.cursor = 'copy';
	if (value === 1) {
		if (creation_mode === 1) {
			creation_mode = 0;
			document.querySelectorAll('img')[0].style.cursor = 'default';
			addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
			add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
			addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
			return;
		}
		creation_mode = 1;
		addBtn.style.backgroundColor = "#ef7280";
		add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
	} else if (value === 2) {
		if (creation_mode === 2) {
			creation_mode = 0;
			document.querySelectorAll('img')[0].style.cursor = 'default';
			addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
			add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
			addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
			return;
		}
		creation_mode = 2;
		add2Btn.style.backgroundColor = "#ef7280";
		addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
	} else if (value === 3) {
		if (creation_mode === 3) {
			creation_mode = 0;
			document.querySelectorAll('img')[0].style.cursor = 'default';
			addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
			add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
			addLine.style.backgroundColor = "rgb(240, 240, 240, 1)";
			return;
		}
		creation_mode = 3;
		addLine.style.backgroundColor = "#ef7280";
		addBtn.style.backgroundColor = "rgb(240, 240, 240, 1)";
		add2Btn.style.backgroundColor = "rgb(240, 240, 240, 1)";
	}
}


// Mouse presser
containerImg.onmousedown = function (e) {
	if (creation_mode === 0) return; //If the mode is not selected, we do nothing

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
	const width = Math.abs(currentX - startX);
	const height = Math.abs(currentY - startY);
	const left = Math.min(currentX, startX);
	const top = Math.min(currentY, startY);

	if (creation_mode == 3) { // For the line
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
		tempRect.style.width = `${width}px`;
		tempRect.style.height = `${height}px`;
		tempRect.style.left = `${left}px`;
		tempRect.style.top = `${top}px`;
		tempRect.classList.add('transparent');
		if (creation_mode == 2) tempRect.classList.add('hiding');
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
			if (creation_mode === 2) tempRect.classList.add('hiding');
			if (creation_mode === 3) tempRect.classList.add('line');

			tempRect.classList.remove('transparent');

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
			}, 50); //delay of 50 ms

			// Add handlers for a new rectangle
			makeDraggable(tempRect);
			makeResizable(tempRect);
			addClickHandlers(tempRect);
		}

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
				handle.setAttribute("title", "RMouse - rotate");
				handle.className = `resize-handle ${corner}`;
				tempRect.appendChild(handle);
			});

			tempRect.setAttribute('data-word', '');
			tempRect.setAttribute('data-hint', '');
			if (creation_mode === 2) tempRect.classList.add('hiding');
			if (creation_mode === 3) tempRect.classList.add('line');

			tempRect.classList.remove('transparent');

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



function removeRectangle() {
	if (selectedRect) {
		selectedRect.remove();
		selectedRect = null;
	}
}


function removeAllRectangle() {
	const rectangles = document.querySelectorAll('.sio-rect');
	rectangles.forEach(rect => rect.remove());
}


document.addEventListener('keydown', function (event) {
	if (event.key === 'Delete' && event.ctrlKey && !event.altKey) {
		event.preventDefault();
		if (!event.shiftKey) {
			removeRectangle();
		}
		else {
			removeAllRectangle();
		}
	}

	if (event.key === 'F2' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		editText();
	}

	if (event.key === 'F3' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		showhideRectangle();
	}

	if (event.key === 'F4' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		exchangeRectangle();
	}

	if (event.key === 'F5' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		showhideAllRectangle();
	}

	if (event.key === 'F6' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		rectangleToRound();
	}

	if (event.key === 'F7' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		addRectangle(1);
	}

	if (event.key === 'F8' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		addRectangle(2);
	}

	if (event.key === 'F9' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		addRectangle(3);
	}
});


function makeDraggable(element) {
	let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

	element.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		if (e.target.className.includes('resize-handle')
			|| !element.classList.contains('selected')
		    || element.classList.contains('text-editing')
			|| creation_mode != 0		
		) return; //block dragging in editing mode

		e.preventDefault();
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e.preventDefault();
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;

		let newLeft = element.offsetLeft - pos1;
		let newTop = element.offsetTop - pos2;

		newLeft = Math.max(0, Math.min(newLeft, img.width - element.offsetWidth));
		newTop = Math.max(0, Math.min(newTop, img.height - element.offsetHeight));

		element.style.left = newLeft + 'px';
		element.style.top = newTop + 'px';

		const rectimg = img.getBoundingClientRect(); //Get real dimensions and position
		const imgWidth = rectimg.width; //Image width
		const imgHeight = rectimg.height; //Image height
		const imgLeft = rectimg.left; //image position by x
		const imgTop = rectimg.top; //Image Images by Y


		const trn = element.style.transform;
		element.style.transform = `rotate(0deg)`;
		const rect = element.getBoundingClientRect(); //Get real dimensions and position
		const rectLeft = rect.left; //Position of a rectangle by x
		const rectTop = rect.top; //Position of a rectangle on y
		element.style.transform = trn;
		const leftPercent = ((rectLeft - imgLeft) / imgWidth) * 100;
		const topPercent = ((rectTop - imgTop) / imgHeight) * 100;
		element.style.left = `${leftPercent}%`;
		element.style.top = `${topPercent}%`;
		wasDragElement = true; //dragged the element
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
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
		e.preventDefault();
		e.stopPropagation();
		const handle = e.target;
		const rect = element;
		const isNW = handle.classList.contains('nw');
		const isNE = handle.classList.contains('ne');
		const isSW = handle.classList.contains('sw');
		const isSE = handle.classList.contains('se');

		if (isNW || isNE || isSW || isSE)
			disable_context_menu = true;

		if (e.buttons === 2 && !rect.classList.contains('line') ) { // right mouse button
			rect.querySelector('.nw').classList.add('rotate');
			rect.querySelector('.sw').classList.add('rotate');
			rect.querySelector('.ne').classList.add('rotate');
			rect.querySelector('.se').classList.add('rotate');
		}

		let startX = e.clientX;
		let startY = e.clientY;
		let startLeft = 0;
		let startTop = 0;
		let startWidth = 0;
		let startHeight = 0;

		//transform relative coordinates to pixels
		const rectimg = img.getBoundingClientRect(); //Get real dimensions and position
		const imgWidth = rectimg.width; //Image width
		const imgHeight = rectimg.height; //Image height
		const imgLeft = rectimg.left; //image position by x
		const imgTop = rectimg.top;//Image Images by Y	

		//we get the coordinates that would occupy a rectangle if they would not turn
		const trn = rect.style.transform;
		rect.style.transform = `rotate(0deg)`;
		const rectEl = rect.getBoundingClientRect(); //Get real dimensions and position
		startWidth = rectEl.width; //The width of the rectangle
		startHeight = rectEl.height; //The height of the rectangle
		startLeft = rectEl.left; //Position of a rectangle by x
		startTop = rectEl.top; //Position of a rectangle on y
		rect.style.transform = trn;
		rect.style.left = startLeft - imgLeft + "px";
		rect.style.top = startTop - imgTop + "px";
		rect.style.width = startWidth + "px";
		rect.style.height = startHeight + "px";
		let startMouseAngleRad = Math.atan2(e.clientY - startTop, e.clientX - startLeft);
		const match = rect.style.transform.match(/rotate\(([-\d.]+)deg\)/);
		startAngle = match ? parseFloat(match[1]) : 0;

		document.onmousemove = elementResize;
		document.onmouseup = closeResizeElement;


		function elementResize(e) {
			e.preventDefault();
			let newWidth, newHeight, newLeft, newTop;
			// We can calculate the difference (delta) of the change in coordinate X and the coordinate y coordinate
			let dx = e.clientX - startX;
			let dy = e.clientY - startY;
			let trn = rect.style.transform;
			const match = trn.match(/rotate\(([-\d.]+)deg\)/)
			let angle = 0;
			if (match) angle = parseFloat(match[1]);
			const angleRad = (angle * Math.PI) / 180; // We convert the angle of degrees into radian
			if (Math.abs() < 0.008) { // An angle less than half a degree is considered zero
				angleRad = 0;
				rect.style.transform = "";
			}
			let { x: localDX, y: localDY } = rotateToLocal(dx, dy, angleRad);

			if( !rect.classList.contains('line') ) {	
				if (e.buttons === 1) { // left mouse button
					let rawLeft = startLeft;
					let rawTop = startTop;

					if (isNW) {
						newWidth = startWidth - localDX;
						newHeight = startHeight - localDY;
						rawLeft += localDX;
						rawTop += localDY;
					} else if (isNE) {
						newWidth = startWidth + localDX;
						newHeight = startHeight - localDY;
						rawTop += localDY;
					} else if (isSW) {
						newWidth = startWidth - localDX;
						newHeight = startHeight + localDY;
						rawLeft += localDX;
					} else if (isSE) {
						newWidth = startWidth + localDX;
						newHeight = startHeight + localDY;
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
					if ( rect.classList.contains('line') )
						rect.style.height = "2px";
					else
						rect.style.height = `${heightPercent}%`;
				}
				else if (e.buttons === 2) { // right mouse button (rotate around top left corner)
					const rdx = e.clientX - startLeft;
					const rdy = e.clientY - startTop;
					// The angle between the upper left corner and the current mouse					
					const currentAngleRad = Math.atan2(rdy, rdx);
					const deltaAngleRad = currentAngleRad - startMouseAngleRad;
					// Angle in degrees
					const newAngleDeg = startAngle + deltaAngleRad * (180 / Math.PI);
					rect.style.transform = `rotate(${newAngleDeg}deg)`;	

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
					if ( rect.classList.contains('line') )
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

					const newWidth = Math.sqrt((rectX2 - left) ** 2 + (rectY2 - top) ** 2);
					// We calculate the new angle (angle) in radiates, then convert into degrees
					const newAngleRad = Math.atan2(rectY2 - top, rectX2 - left);
					const newAngle = (newAngleRad * 180) / Math.PI;
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
			rect.querySelector('.nw').classList.remove('rotate');
			rect.querySelector('.sw').classList.remove('rotate');
			rect.querySelector('.ne').classList.remove('rotate');
			rect.querySelector('.se').classList.remove('rotate');


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
		const textDiv = selectedRect.querySelector('.txt-sio-rect');
		if (!textDiv.parentElement.classList.contains('hiding') && !textDiv.parentElement.classList.contains('line')) {
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
			}
		}
	}
}


function addClickHandlers(element) {
	// Add an Input event processor to tell in red if only one is introduced:
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
		if (textDiv.isContentEditable) {
			if (element != selectedRect) {
				document.querySelectorAll('.sio-rect').forEach(rect => {
					rect.classList.remove('selected');
				});
				selectedRect = element;
				element.classList.add('selected');
			}
			return;
		}

		document.querySelectorAll('.sio-rect').forEach(rect => {
			rect.classList.remove('selected');
		});

		selectedRect = element;
		element.classList.add('selected');
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
	if (selectedRect) {
		if (!selectedRect.classList.contains("line")) {
			const isTransparent = selectedRect.classList.contains('transparent');
			if (isTransparent) {
				selectedRect.classList.remove('transparent');
			}
			else {
				selectedRect.classList.add('transparent');
			}
		}
	}
}


// show / hide all rectangles
function showhideAllRectangle() {
	let element = document.querySelectorAll('.sio-rect')[0];
	if (element) {
		const isTransparent = element.classList.contains('transparent');
		if (isTransparent) {
			hideAllRectangle();
		}
		else {
			showAllRectangle();
		}
	}
	else {
		showAllRectangle();
	}
}


// Hide all rectangles
function hideAllRectangle() {
	document.querySelectorAll('.sio-rect').forEach(rect => {
		rect.classList.remove('selected');
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
		rect.classList.remove('transparent');
	});
}


//Show all the rectangles
function showAllRectangle() {
	document.querySelectorAll('.sio-rect').forEach(rect => {
		rect.classList.remove('selected');
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
		if (!rect.classList.contains("line"))
			rect.classList.add('transparent');
	});
}


//discharge of discharge when clicking on the container
containerImg.onclick = function (e) {
	e.stopPropagation();
	document.querySelectorAll('.sio-rect').forEach(rect => {
		rect.classList.remove('selected');
		rect.classList.remove('text-editable');
		rect.classList.remove('text-editing');
	});
	document.querySelectorAll('.txt-sio-rect.text-editable').forEach(rect => {
		rect.classList.remove('text-editable');
		rect.contentEditable = false;
		rect.parentElement.classList.remove('text-editing'); //Remove the class of editing mode		
	});
	selectedRect = null;
};


// Change the form
function rectangleToRound() {
	if (selectedRect) {
		const textDiv = selectedRect.querySelector('.txt-sio-rect');
		par = textDiv.parentElement;
		if (par.classList.contains('round')) par.classList.remove('round');
		else par.classList.add('round');
		textDiv.focus();
	}
}

//Change the type of rectangle
function exchangeRectangle() {
	if (selectedRect) {
		const textDiv = selectedRect.querySelector('.txt-sio-rect');
		par = textDiv.parentElement;
		//const isTransparent = par.classList.contains('transparent');	
		if (par.classList.contains('hiding')) par.classList.remove('hiding');
		else par.classList.add('hiding');
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
			rect.classList.remove('selected');
			rect.classList.remove('text-editable');
			rect.classList.remove('text-editing');
		});
		document.querySelectorAll('.txt-sio-rect.text-editable').forEach(rect => {
			rect.classList.remove('text-editable');
			rect.contentEditable = false;
			rect.parentElement.classList.remove('text-editing'); //Remove the class of editing mode			
		});
		selectedRect = null;
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
document.addEventListener('contextmenu', function (event) {
	//event.preventDefault(); // Blocks the context menu 
	if (disable_context_menu) {
		event.preventDefault(); // Blocks the context menu 
	}
});

// Call the function after loading the document
document.addEventListener('DOMContentLoaded', initializeRectangles);



function fitFontSizeToRect(rectElement) {
	let txtEl = rectElement.textContent;		
	let maxChars = 12;
	if( txtEl.length > 0 ) {
		let pz = txtEl.indexOf("::");
		if(pz > 0) txtEl = txtEl.slice(0, pz); 
		maxChars = Math.max(txtEl.length, maxChars);
	}
	const minFontSize = 10;
	const maxFontSize = 100; // Upper limit
	const rectWidth = rectElement.clientWidth; // Let's get the width of the rectangle	
	const rectHeight= rectElement.clientHeight;
	
	
	const temp = document.createElement("span"); // Create a time element for measurement
	temp.style.visibility = "hidden";
	temp.style.whiteSpace = "nowrap";
	temp.style.position = "absolute";
	temp.style.padding = "0";
	temp.style.margin = "0";
	temp.style.fontFamily = getComputedStyle(rectElement).fontFamily;
	temp.textContent = "N".repeat(maxChars); // The widest text option
	document.body.appendChild(temp);
	let fontSize = maxFontSize;
	while (fontSize > minFontSize) {
		temp.style.fontSize = fontSize + "px";
		const textWidth = temp.getBoundingClientRect().width;
		const textHeight = temp.getBoundingClientRect().height;
		if (textWidth <= rectWidth && textHeight <= rectHeight) {
			break;
		}
		if(fontSize < 24) fontSize--;
		else if(fontSize < 48) fontSize -= 2;
		else if(fontSize < 96) fontSize -= 4;
		else fontSize -= 8;
	}	
	document.body.removeChild(temp); // Let's remove the temporary element	
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

window.addEventListener('scroll', updateFontSize);
window.addEventListener('resize', updateFontSize);