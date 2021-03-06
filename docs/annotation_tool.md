# Annotation Tool - Potree Extension

## Set Up

#### Install Prerequisites
1. Install [node.js](https://nodejs.org/en/) & npm
1. Install [XAMPP](https://www.apachefriends.org/index.html) & set it up
1. Clone repository or download .zip-File to */xampp/htdocs*
1. Navigate to the *Potree* directory
1. Run the following commands to install gulp
```
npm install --save
npm install -g gulp
npm install -g rollup
```

#### Run the program

1. Open Xampp and run the Apache Server and MySQL
![XAMPP](./images/xampp.PNG)
1. Create the MySQL Database (refer to section *Database*)
1. Go to http://localhost/potree/examples/index.html
![Index Page](./images/index_page.png)
1. Choose to upload your own point cloud or use the default one
1. The Set Up was successful if you see this page:
![Main Page](./images/main_page.png)

#### Upload Your Own Point Cloud

On the Start Page of Potree you may choose to upload your own point cloud.

To do that, make sure to copy your point cloud folder (in .potree format) to ```/potree/pointclouds/```

## How to Use the Annotation Tool

The annotation tool allows the user to use different volume measurements to segregate the point cloud into smaller units.

#### Toolbar

There are currently two working volume measurements available: **Box Volumes** and **Sphere Volumes**. In the future, Height Profile and Polygonal Volume may be added.

![Toolbar](./images/selection_toolbar.PNG)

Furthermore the toolbar offers the user the possibilities to save all current selections to the database; delete all current selections both from Potree as well as the database; and the visibility tool, that can hide or show all saved selections.

#### Infobar

The infobar opens up if the users adds a new selection or clicks on a selection volume from the scene.

It gives more detailed information about the current box, such as type, id, position, dimension and rotation:
 ![Infobar](./images/infobar.PNG)

Moreover, it gives the user the chance to define properties for this selection, such as the material. These properties are saved in the database once the selection was saved; either by clicking *Save Volume* in the infobar or *Save All Selections* in the toolbar.

Lastly, the infobar provides the user with the ability to retrieve all point cloud points within the chosen selection box and download them either as .las or .csv files.


## Database

In order to save the selections and their properties, the potree extension uses a MySQL Database, also hosted on the local machine: ```http://localhost/phpmyadmin/```

#### Set up

1. Run MySQl on Xampp
1. Navigate to http://localhost/phpmyadmin
1. Create a new database
1. Import the file *potree/database/database.sql*

If needed, the user can change the database properties in ```/potree/database/connection.php ```

It is necessary to define the server, username, password (if applicable) and database name.

```con = mysqli_connect('localhost','root','','potree');```

The database consists of three tables:
* box
* materials
* points

**1. Box Table:**

The box table is used to store all selections.

![Box Table](./images/database_box_table.PNG)

**2. Materials Table:**

The material table allows the user to reference materials in the box table with an ID; and specifies the properties of the material.

![Material Table](./images/database_material_table.PNG)

**3. Points Table:**

The points table saves individual points with their position and additional properties.

![Point Table](./images/database_point_table.PNG)
