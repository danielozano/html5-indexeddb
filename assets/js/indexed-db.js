window.onload = function () {
    var IndexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var taskForm = document.getElementById('task-form');
    var listContainer = document.getElementById('list-container');
    /**
     * Intenta obtener la conexión a la base de datos 'list', y si no existe
     * la creará en su versión 1.
     * Al realizar cambios de versión no se hace ningún cambio en la base de datos,
     * simplemente se permite lanzar unos triggers para ejecutar funciones al estilo
     * migración.
     */
    var database = IndexedDB.open('list', 3, true);
    
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
        database.close();
    };

    // callback para operación exitosa en base de datos
    database.onsuccess = function (e) {
        loadAll();
    };

    // Callback para operación errónea en base de datos
    database.onerror = function (e) {

    };

    /**
     * TODO: mejorar HTML.
     */
    var renderTask = function (task, reset = false) {
        var container = listContainer;
        var html = document.createElement('div');

        if (true === reset) {
            container.innerHTML = '';
        }

        html.classList.add('task');

        html.innerHTML = "id: " + task.task_id + " - título: " + task.title;

        container.appendChild(html);
    };

    /**
     * Función para almacenar un objeto en la base de datos
     */
    function insert (almacenes, obj) {
        var connection = database.result;
        // necesitamos obtener la transacción, para ello necesitamos los almacenes o el almacén en el cual
        // realizaremos las operaciones, y el tipo de transacción: 'readwrite' en este caso
        var transaction = connection.transaction(almacenes, 'readwrite');

        // seguidamente crear el objeto y almacenarlo en el almacén.
        [].forEach.call(almacenes, function (almacen) {
            var objectStore = transaction.objectStore(almacen);
            var request = objectStore.add(obj);

            request.onsuccess = function (event) {
                console.log('Objeto insertado correctamente');
            };
        });

        // En caso de que exista algún error en la transacción.
        transaction.onerror = function (e) {
            console.log('Task insertada correctamente');
            console.log(e);
        };

        // Si la transacción ha sido completada sin errores
        transaction.oncomplete = function (e) {
            taskForm.reset();
            listContainer.innerHTML = '';
            loadAll();
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

    /**
     * Cargar y pintar todos los registros almacenados en base de datos
     */
    var loadAll = function () {
        var connection = database.result;
        var transaction = connection.transaction('tasks');
        var objectStore = transaction.objectStore('tasks');
        var elements = [];

        transaction.oncomplete = function (event) {
            [].forEach.call(elements, function(task) {
                renderTask(task);
            });
        };

        var cursorRequest = objectStore.openCursor();

        cursorRequest.onerror = function (error) {
            console.log(error);
        };

        cursorRequest.onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {
                elements.push(cursor.value);
                cursor.continue();
            }
        };
    };
};