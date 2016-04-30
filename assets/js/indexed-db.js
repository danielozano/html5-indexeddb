(function() {
	var IndexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	var taskForm = document.getElementById('task-form');
	/**
	 * Intenta obtener la conexión a la base de datos 'list', y si no existe
	 * la creará en su versión 1.
	 * Al realizar cambios de versión no se hace ningún cambio en la base de datos,
	 * simplemente se permite lanzar unos triggers para ejecutar funciones al estilo
	 * migración.
	 */
	var database = IndexedDB.open('list', 3);

	// Esta función es llamada al cambiar la versión de la base de datos
	database.onupgradeneeded = function (e) {
		console.log('actualizando la base de datos...');
		console.log(e);
		// obtener solo la conexión de la base de datos
		var connection = database.result;
		var tasksOptions = {
			keyPath : 'task_id', // propiedad índice (similar a id)
			autoIncrement : true // indicarle que es incremental
		};

		// creamos un almacén de objetos dentro del objeto list (equivalente a tabla)
		var tasksObject = connection.createObjectStore('tasks', tasksOptions);

		// podemos añadir índices a dicho almacén para poder realizar búsquedas, o añadir restricciones
		tasksObject.createIndex('by_author', 'author', { unique: false} );
	};

	// callback para operación exitosa en base de datos
	database.onsuccess = function (e) {

	};

	// Callback para operación errónea en base de datos
	database.onerror = function (e) {

	};

	/**
	 * Función para almacenar un objeto en la base de datos
	 * @param  {array} almacenes [description]
	 * @param  {[type]} datos     [description]
	 * @return {[type]}           [description]
	 */
	function insert (almacenes, obj) {
		var connection = database.result;

		// necesitamos obtener la transacción, para ello necesitamos los almacenes o el almacén en el cual
		// realizaremos las operaciones, y el tipo de transacción: 'readwrite' en este caso
		var transaction = connection.transaction(almacenes, 'readwrite');

		// seguidamente crear el objeto y almacenarlo en el almacén.
		[].forEach.call(almacenes, function (almacen) {
			var objectStore = transaction.objectStore(almacen);
			var query = objectStore.put(obj);
		});

		// En caso de que exista algún error en la transacción.
		transaction.onerror = function (e) {
			console.log('Task insertada correctamente');
			console.log(e);
		};

		// Si la transacción ha sido completada sin errores
		transaction.oncomplete = function (e) {
			taskForm.reset();
			console.log('Task insertada correctamente');
			console.log(e);
		};
	};

	taskForm.addEventListener('submit', function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		}
		var taskObject = {};

		for (var i = 0; i < this.elements.length; i++) {
			var formElement = this.elements.item(i);
			var formElementType = formElement.getAttribute('type');
			// evitar submits
			if (formElementType !== 'submit') {
				taskObject[formElement.getAttribute('name')] = formElement.value;
			}
		};

		insert(['tasks'], taskObject);
	});
})();