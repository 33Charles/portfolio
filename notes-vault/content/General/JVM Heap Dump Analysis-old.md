### What is the JVM?

The Java Virtual Machine (JVM) is the runtime environment that executes Java bytecode. When a Java application starts, the JVM loads classes, creates objects, executes code, and manages memory.

A typical Java application might use Spring Boot for its web API, Tomcat to handle HTTP requests, and H2 to manage an in-memory database. These components run inside the JVM.

A simplified architecture looks like this:

![[Pasted image 20261013083443.png]]

When the application runs, it creates objects representing things such as HTTP requests, database connections, user accounts, configuration properties, and authentication sessions.

A heap dump captures information about many of these objects at a particular point in time.

### How Java memory is organized

To understand heap dumps properly, you need to understand how a Java application uses memory while it runs. The JVM does not store everything in one place. It uses several memory areas, each with a different purpose, lifetime, and relationship to `garbage collection`.

We'll examine five areas:

1. Heap
2. Thread stacks
3. Metaspace
4. Code cache
5. Native memory

Then we'll connect them to heap-dump analysis.

####  The big picture

Imagine a Spring Boot application running a REST API. It accepts HTTP requests, authenticates users, accesses a database, and returns JSON responses.

As it runs, the application needs memory for different things:

- User and configuration objects.
- Method calls and local variables.
- Information about loaded Java classes.
- Machine code produced by the JIT compiler.
- Native libraries, thread resources, and other operating-system-level allocations.

A simplified diagram:

![[Pasted image 20261013085321.png]]

Some are managed by the JVM, some by the operating system, and some overlap with broader accounting categories.The distinction matters because a Java heap dump primarily describes heap objects, it is not a complete snapshot of every memory area used by the JVM process.

#### The heap

The heap is the main memory area where Java objects and arrays are allocated. It is shared across threads within the same JVM.

For example:

```java
class User {
    String username;
    String email;
}
```

When an application creates an instance:

```
User user = new User();
user.username = "doe";
user.email = "doe@example.test";
```

Conceptually, the heap contains a `User` object and the objects it references.

![[Pasted image 20261013085854.png]]

Notice the important distinction: the local variable `user` is part of the method's execution state, while the `User` instance is conceptually a heap object.

##### What lives in the heap?

Common examples include:
- Instances of application classes.
- Strings and collections.
- Arrays.
- Objects created by Spring, Tomcat, JDBC drivers, and other libraries.
- Configuration objects.
- Cached records and application data.
- Objects involved in HTTP requests and authentication.

This is why the heap is especially relevant to security analysis. If a secret is represented by a Java object and that object remains in the captured heap, a heap dump may expose it.

##### Is the heap shared by all threads?

Yes. Threads in the same JVM can access shared heap objects if they have references to them.

Imagine a web application handling two requests:
- Thread A processes an administrator's request.
- Thread B processes a passenger lookup.

Both threads may access a shared Spring service or configuration object. The objects they use can live in the same heap, even though the threads have separate stacks. This explains why the heap is useful for investigating application-wide objects, while stacks help explain what individual threads are doing.

##### How does garbage collection work?

Java manages most heap memory automatically through garbage collection (GC). An object becomes eligible for collection when it is no longer reachable through the JVM's relevant reachability rules.

For example:

```
User user = new User();
user = null;
```

Setting `user` to `null` removes that particular reference. It does not guarantee that the object is immediately garbage-collected: another reference might still exist, and collection timing is not deterministic.

Consider this situation:

```
class ApplicationCache {
    static User cachedUser = new User();
}
```

The static field can keep the user object reachable for as long as the relevant class and reference remain live. Merely finishing a request does not guarantee that the object will be removed.

For heap-dump analysis, ask:
- What object contains the data?
- What references point to it?
- Is it still reachable?
- Could a cache, static field, session, or long-lived service be retaining it?

MAT's Paths to GC Roots feature is useful for answering the last two questions.

### Thread stacks

A thread is an execution path within a process. Java web servers commonly use multiple threads to handle requests concurrently.For example, one thread might handle a login request while another processes a flight search.Each Java thread has its own stack. The heap, by contrast, is shared among threads in the same JVM.

#### What is a stack frame?

When a method is called, the thread's execution state includes a frame for that method. The frame tracks information needed to execute the method, such as local variables, intermediate computation state, and the return point.

Consider:

```
public User findUser(String username) {
    User user = userRepository.findByUsername(username);
    return user;
}
```

While this method is executing, its frame conceptually contains the method's local execution state, including the `username` parameter and the local variable `user`.

The actual representation depends on the JVM and compiler optimizations. Not every source-level variable necessarily exists in a directly inspectable form at every moment.

## 3.3 Stack versus heap

|Characteristic|Stack|Heap|
|---|---|---|
|Organization|Per thread|Shared within the JVM|
|Main purpose|Method execution state|Objects and arrays|
|Typical contents|Frames, local variables, intermediate state|User objects, strings, collections|
|Lifetime|Frames are pushed and popped as methods execute|Objects remain while reachable, subject to JVM behavior|
|Typical troubleshooting use|Thread state and execution problems|Memory usage, object retention, application data|
|Captured by an ordinary heap dump?|Not as a complete stack snapshot|Yes, the heap is the primary target|

A common oversimplification is that “primitives live on the stack and objects live on the heap.” The better model is that objects are generally heap-allocated, while primitive values and references can appear in different places depending on whether they are fields, local variables, static fields, or optimized execution state.
#### Why stacks matter for security

Suppose a method receives a token:

```
public void validateToken(String token) {
    // validation logic
}
```

During execution, the method's frame may hold a reference to the token string. The string object itself is generally on the heap. An ordinary heap dump might capture the string object, but it should not be treated as a guaranteed record of the method's local variables or the full call stack.

If you need to know what a thread was executing, which method called another method, or what its stack frames contained, you may need a thread dump or a richer diagnostic capture rather than only a heap dump.

### Metaspace

Metaspace is the JVM memory area used for class metadata in modern HotSpot JVMs. It replaced the permanent generation (PermGen) in Java 8. Class metadata includes structural information about loaded classes, such as their names, fields, methods, and related runtime structures.

For example, when the JVM loads a class called:

```
com.example.DatabaseConfig
```

it needs metadata describing that class so it can create and work with its instances. The class metadata is conceptually different from an instance of `DatabaseConfig`.

#### Class versus instance

Consider:

```
class DatabaseConfig {
    String username;
    String password;
}
```

There are two different things to understand:
- The class definition describes the type and its fields.
- Each `DatabaseConfig` instance contains the particular field values for that instance.

A heap dump may include class metadata needed to interpret the instances, but metaspace itself is not simply another collection of ordinary heap objects.

![[Pasted image 20261013094517.png]]

The diagram shows the conceptual relationship, not a literal pointer layout.

#### What is a class loader?

A class loader loads classes into the JVM. Applications may use multiple class loaders, particularly when frameworks, plugins, application servers, or dynamic class loading are involved.

Class loaders are relevant to memory troubleshooting because classes and class loaders may remain live longer than expected. In some situations, a class loader cannot be reclaimed because objects or other references still retain it.

This can contribute to class-loader memory leaks, particularly in application servers where applications are redeployed repeatedly.

#### Why metaspace matters in heap-dump analysis

Suppose your dump contains references to:

```
org.springframework...
org.apache.catalina...
com.zaxxer.hikari...
```

These names can help you identify frameworks and libraries represented in the captured application. They do not, by themselves, prove that those components are vulnerable or that a particular feature is active.

MAT can display class information and class-loader relationships that help you interpret the heap. However, a heap dump is not a direct, complete dump of all metaspace allocations.

If you suspect a metaspace problem, JVM monitoring, class-loading diagnostics, and native-memory tools may be more appropriate than relying exclusively on a heap dump.

Metaspace takeaway: It helps explain which classes exist and how the application is structured, but it is distinct from the ordinary heap objects whose field values you inspect.

### Code cache

The JVM can interpret bytecode and use a Just-In-Time (JIT) compiler to compile frequently executed methods into native machine code. The **code cache** is memory used by HotSpot to store compiled code and related runtime structures.

For example, a method in a web application might be called thousands of times. Depending on runtime behavior and JVM decisions, the JIT compiler may compile it into machine code to improve performance.

The compiled instructions are not the same thing as the Java objects that method creates or accesses.

#### Why code cache is separate

Consider:

```
public int add(int a, int b) {
    return a + b;
}
```

There are several distinct concepts:

- The source code is the human-readable Java program.
- Bytecode is the JVM-level representation produced by compilation.
- Compiled machine code may be stored in the code cache.
- Objects created or accessed by the method may occupy heap memory.

These are different representations and memory uses.

#### Is code cache useful for heap analysis?

Usually, not directly.

If your goal is to find a configuration object's password field, the code cache is not the place to start. You want to inspect the heap object and its references.

Code-cache investigation becomes more relevant when diagnosing:

- JIT compilation issues.
- Code-cache exhaustion.
- Runtime compilation behavior.
- Certain performance problems.

Those issues generally require JVM performance and compiler diagnostics.

Code-cache takeaway: It stores compiled code, not the ordinary application objects you are trying to inspect in a heap dump.

### Native memory

Native memory is memory allocated outside the Java heap. It can be used by the JVM itself, native libraries, and components that interact with the operating system.

Examples include:

- Thread stacks and native thread resources.
- Direct byte buffers.
- Native libraries.
- Certain JVM internal structures.
- Memory used by native code called through JNI.
- Some memory used by garbage collectors and other runtime components.

Native memory is not one single pool with one allocator. Different components manage different allocations.

#### Direct buffers

Java applications can use direct byte buffers, for example:

```
ByteBuffer buffer = ByteBuffer.allocateDirect(1024);
```

This allocates a direct buffer whose backing storage is outside the ordinary Java heap, although the Java `ByteBuffer` object itself is a heap object.

This distinction is important: the heap dump might show the Java wrapper object without providing a complete view of all the backing native memory.

Direct buffers can be useful for high-performance I/O, but they can also contribute to memory pressure outside the heap.

#### Native libraries and JNI

Java Native Interface (JNI) allows Java code to interact with native code, commonly written in C or C++.

A native library can allocate memory or retain data outside the Java heap. A heap dump might show Java objects associated with that library, but it will not necessarily contain the native allocations themselves.

This is one reason a process can consume more memory than the heap's reported usage suggests.

#### Native memory versus process memory

When you run a tool such as:

```
ps -o pid,rss,vsz,comm -p <PID>
```

you are looking at operating-system process memory metrics, not simply Java heap usage.

- RSS is resident memory currently mapped into physical RAM.
- VSZ is virtual address space.
- Neither is equivalent to the heap size or retained heap reported by MAT.

The relationship between these figures depends on the JVM, garbage collector, operating system, and allocation patterns.

If native memory is the suspected problem, HotSpot's Native Memory Tracking (NMT), when enabled, can help investigate JVM native-memory categories. It has prerequisites and overhead, and it does not account for every possible native allocation.

Native-memory takeaway: A heap dump is not sufficient to explain every source of JVM process memory consumption.

>[!info]
>- Object: An instance of a Java class.
>- Field: A value or reference stored in an object.
>- Reference: A connection from one object to another.
>- `.hprof` commonly refers to the Java heap-dump format associated with HPROF tooling. It is a binary format, not a plain-text document.



###  Initial triage

The `strings` command is useful for initial triage, but it does not understand the HPROF object graph.

#### Why `strings` can be misleading

Suppose the output contains:

```
DB_PASSWORD
spring.datasource.url
password
```

Those strings may originate from different objects. They may be configuration keys, library documentation, default values, application messages, or actual runtime data.

A plain text search cannot tell you whether:

- `DB_PASSWORD` is an environment-variable name or a populated configuration value.
- A string is part of an active application object or merely a library constant.
- A URL is currently in use or is only a template.
- A password-like string is valid or belongs to the application.

The purpose of MAT is to restore the object-level context that a flat text search loses.

### Understanding object graphs

An object graph is a representation of objects and the references connecting them. This is the most important mental model for heap-dump analysis.

Imagine an application with these objects:
- A Spring configuration object.
- A datasource object.
- A connection pool.
- A database connection.
- A set of application records.

The configuration object may reference the datasource, the datasource may reference the connection pool, and the connection pool may reference connections.

A conceptual graph could look like this:

![[Pasted image 20261013102602.png]]

#### Why references matter

Suppose you discover the text `example-value` in a heap dump. On its own, you do not know whether it is:

- A password.
- A test fixture.
- An error-message fragment.
- A sample configuration value.
- A real secret held by a live object.

If MAT lets you locate the corresponding string object and inspect the objects that reference it, you can gather more context. For example, a reference from a live datasource configuration object is more relevant to a credential investigation than the same text appearing inside a library's documentation string.

However, even a plausible relationship does not establish that a credential works. That is a separate question.

### Reachability and garbage collection

Java garbage collection primarily determines which objects remain reachable from a set of roots. **GC** roots are starting points from which the JVM can trace reachable objects. Examples include certain thread references, static fields, and JVM-managed references.

An object reachable from a root may be retained in memory. An unreachable object may be eligible for garbage collection. For analysis, this means that a secret can remain in memory even after the operation that originally used it has finished, if some object still references it.

Conversely, a heap dump does not necessarily contain every object ever created by the application. Objects that were collected before the dump was generated will generally no longer be present as ordinary live heap objects.

### Important memory-analysis terminology

Before using MAT, understand these terms.

|Term|Meaning|
|---|---|
|Shallow heap|Memory directly occupied by an object|
|Retained heap|Memory that would become reclaimable if the object and the objects it exclusively retains were no longer reachable|
|GC root|A JVM-recognized starting point for reachability analysis|
|Dominator|An object that must be traversed through to reach a particular object from the roots|
|Class metadata|Information describing a loaded class, such as its name and fields|
|Instance|A particular object created from a class|
|Reference chain|A sequence of object references connecting objects|
|Histogram|A summary of objects grouped by class|
|Object graph|The network of objects and references in the dump|

#### Shallow heap versus retained heap

Suppose a small Java object references a large array.

The object itself might consume little memory, but the array may account for substantial memory that would become reclaimable if the object were no longer reachable and no other references kept the array alive.

That is why retained heap can be more informative than shallow heap when investigating memory leaks.

For security analysis, however, memory size is not the same as security importance. A tiny object containing a sensitive token may matter more than a large harmless array.

#### What is a dominator tree?

A dominator tree organizes objects according to their retention relationships. In memory troubleshooting, it helps answer questions such as:

- Which objects retain the most memory?
- Which objects are responsible for keeping large collections alive?
- Where should I investigate an unexpected memory footprint?

For security work, it may also help you identify major application objects that hold many other objects. But a sensitive object does not have to be a top dominator, so do not limit your investigation to the largest entries.

#### What does “Path to GC Roots” mean?

This feature shows a chain of references connecting an object to a GC root.

It helps answer:

> Why is this object still reachable?

For example, a string may be reachable through a configuration object, which is reachable through a datasource, which is reachable through an application singleton.

That chain can help establish the object's role in the running application.

A path to a GC root does not prove that the value is sensitive or valid. It explains reachability, not security impact.

### Eclipse Memory Analyzer Tool (MAT)

Eclipse MAT is a tool for analyzing Java heap dumps. It parses the dump and presents its objects, classes, references, and memory relationships in a form that is much easier to investigate than raw binary data.

Official resources:
- [Download Eclipse MAT](https://eclipse.dev/mat/)
- [MAT Basic Tutorial](https://help.eclipse.org/latest/topic/org.eclipse.mat.ui.help/gettingstarted/basictutorial.html)
- [MAT documentation](https://help.eclipse.org/latest/topic/org.eclipse.mat.ui.help/welcome.html)

#### Opening a heap dump

After installing MAT:

1. Launch the MAT application.
2. Open `heapdump.hprof` using its file-opening option.
3. Allow MAT to parse the file and build its indexes.
4. Examine the Overview page and the reports it offers.

#### The Overview page

The Overview page gives you an initial summary of the heap dump and links to analysis reports. Use it to orient yourself before searching individual objects.

Questions to ask:
- How many objects and classes were parsed?
- How much heap memory is represented?
- Which reports are available?
- Are there obvious memory-related anomalies?

Remember that these statistics describe the captured heap.

#### The Histogram

The Histogram groups objects by class. For example, you might see classes such as:

```
java.lang.String
java.util.HashMap
java.util.ArrayList
com.zaxxer.hikari.HikariDataSource
```

The Histogram helps answer:
- Which classes have the most instances?
- Which classes account for significant shallow heap?
- Are application-specific classes present?
- Which classes might be worth investigating?

A high count of `java.lang.String` is normal in many Java applications. A large number of strings is not, by itself, evidence of a secret leak.

For your investigation, search for application-specific classes and configuration-related classes, rather than assuming every framework class is significant.

#### The Dominator Tree

The Dominator Tree helps identify objects that retain other objects and memory.

Use it when investigating:
- Large caches.
- Unexpectedly retained collections.
- Objects responsible for a large portion of memory.
- Application structures that may lead to memory leaks.

Sort or inspect entries by retained heap when looking for memory-retention problems.

For security analysis, use the Dominator Tree as a navigation aid—not as a secret-finding report. Small configuration objects and individual strings can be important even when they retain very little memory.

#### Object Inspector

The Object Inspector allows you to examine an individual object's fields and relationships. This is where you move from seeing a class name to understanding a specific instance.

Suppose you locate a datasource-related object. You might inspect its class, fields, and referenced objects to understand whether it points to other configuration or connection-related objects.

When inspecting an object, ask:
1. What class does this object belong to?
2. What fields does it contain?
3. Which fields hold primitive values, and which hold references?
4. What objects do those references lead to?
5. Is the data application-specific, or does it appear to be framework metadata?
6. Does the surrounding context support the interpretation you are considering?

#### Paths to GC Roots

When you find an interesting object, use the path-to-roots analysis to understand how it remains reachable.

For example, a possible path might involve:

```
GC root
   ↓
Application singleton
   ↓
Configuration object
   ↓
String object
```

If the string contains a suspected credential, the chain may help show that the string is associated with an application configuration object.

Be careful when interpreting paths: framework wrappers, caches, maps, and proxies can make the chain longer than expected. Trace the objects rather than relying only on their names.

#### Object Query Language (OQL)

MAT includes an Object Query Language for querying objects in a heap dump. It can help when the graphical interface becomes tedious or when you want to find instances of particular classes.

Learn OQL after you are comfortable with the Histogram and Object Inspector.

- [MAT documentation and query resources](https://help.eclipse.org/latest/topic/org.eclipse.mat.ui.help/welcome.html)

Start by learning how to query instances of a class, inspect fields, and filter results. OQL syntax and the available properties depend on MAT's query engine and the dump's parsed structure, so check the documentation rather than assuming every SQL operation is supported.

### Initial terminal commands

```bash
# Check the file type
file heapdump.hprof

# Check the file size
ls -lh heapdump.hprof

# Extract printable strings into a separate file
strings -a heapdump.hprof > dump.txt

# Search for database configuration identifiers
grep -inE 'DB_PASSWORD|DB_USERNAME|spring\.datasource|jdbc:h2' dump.txt

# Search for authentication-related terms
grep -inE 'password|secret|token|api[_-]?key|jwt|authorization' dump.txt
```


### Analyzing Database Connections and Databases in Java Heap Dumps

 How to identify database technologies, connection configurations, credentials, connection pools, and database-related data inside a Java heap dump.

#### Understanding the database connection stack

A Java application usually interacts with a database through several layers.

![[Pasted image 20261013105313.png]]

Each layer may leave different objects or strings in a heap dump. Finding a database driver does not automatically prove a live connection exists, and finding a connection pool class does not prove that the application is currently using it.

#### Essential concepts

| Concept         | Meaning                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Database        | Stores and organizes application data.                                                                   |
| JDBC            | Java's standard API for communicating with relational databases.                                         |
| JDBC driver     | Implements the database-specific communication used by JDBC.                                             |
| JDBC URL        | Specifies the database type and connection destination or configuration.                                 |
| DataSource      | An object applications use to obtain database connections.                                               |
| Connection pool | Reuses database connections instead of repeatedly creating new ones.                                     |
| ORM             | Object-relational mapping; maps application objects to database records. Hibernate is a common Java ORM. |
| Credentials     | Username, password, or other authentication material used to connect to a database.                      |
| Query result    | Data returned from a database query, which may remain in heap objects.                                   |
| Transaction     | A unit of database work managed under transaction rules.                                                 |

#### Recognizing JDBC URLs

JDBC URLs often provide the fastest clue about the database technology being used.

##### Common URL formats

PostgreSQL

```
jdbc:postgresql://<DB_HOST>:<DB_PORT>/<DB_NAME>
```

MySQL

```
jdbc:mysql://<DB_HOST>:<DB_PORT>/<DB_NAME>
```

Microsoft SQL Server

```
jdbc:sqlserver://<DB_HOST>:<DB_PORT>;databaseName=<DB_NAME>
```

Oracle

```
jdbc:oracle:thin:@//<DB_HOST>:<DB_PORT>/<SERVICE_NAME>
```

H2 in-memory database

```
jdbc:h2:mem:<DB_NAME>
```

H2 file-based database

```
jdbc:h2:file:<DATABASE_PATH>
```

#### What to search for in a heap dump

The most useful approach is to search by category rather than looking for the word `password` alone.

| Category                | Example search terms                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| JDBC URLs               | `jdbc:`, `jdbc:postgresql:`, `jdbc:mysql:`, `jdbc:h2:`                              |
| Spring configuration    | `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password` |
| JDBC connection objects | `java.sql.Connection`, `ConnectionImpl`, `JdbcConnection`                           |
| Data sources            | `javax.sql.DataSource`, `HikariDataSource`, `BasicDataSource`                       |
| Connection pools        | `HikariPool`, `HikariConfig`, `PoolBase`                                            |
| ORM and persistence     | `EntityManager`, `SessionFactory`, `hibernate.connection.url`                       |
| Credential fields       | `password`, `username`, `user`, `secret`, `credential`                              |
| Query-related objects   | `PreparedStatement`, `ResultSet`, `Statement`                                       |
| Database records        | Application-specific entity classes, such as `User`, `Account`, or `Customer`       |
|                         |                                                                                     |

These terms are clues, not proof. A class name may exist because a library was loaded, a configuration object was created, or an unused feature was included in the application.

#### Initial triage with command-line tools

Assume the heap dump is named `heapdump.hprof`.
##### Step 1: Verify the file

```bash
file heapdump.hprof
ls -lh heapdump.hprof
sha256sum heapdump.hprof
```

Record the file type, size, and hash. A `.hprof` extension alone does not guarantee that the file is a valid or complete heap dump.

##### Step 2: Extract readable strings

```bash
strings -a heapdump.hprof > heap-strings.txt
```

The `-a` option scans the whole file for printable strings.

Search for database connection information:

```bash
grep -inE 'jdbc:|spring\.datasource|hibernate\.connection' heap-strings.txt
```

Search for connection pools and database libraries:

```bash
grep -inE 'HikariDataSource|HikariConfig|HikariPool|BasicDataSource|EntityManager|SessionFactory' heap-strings.txt
```

Search for potential credential-related strings:

```bash
grep -inE 'password|username|credential|secret|api[_-]?key' heap-strings.txt
```

Inspect surrounding text:

```bash
grep -in -C 3 'spring.datasource.password' heap-strings.txt
```

The `-C 3` option displays three lines before and after each match.

Limitation: Nearby strings in a flat text extraction are not necessarily fields of the same Java object. Do not infer that a password belongs to a particular database simply because it appears near a JDBC URL.

#### Analyzing database connections in Eclipse MAT

For deeper analysis, use the Eclipse Memory Analyzer Tool (MAT).

##### Open the heap dump

Open the `.hprof` file in MAT and allow it to parse and index the dump. Large dumps may require substantial RAM and disk space.

##### Step 2: Inspect the Histogram

The Histogram groups objects by class. Search for classes associated with:
- `DataSource`
- `Connection`
- `HikariConfig`
- `HikariDataSource`
- Database-specific connection implementations
- ORM sessions and entity managers

The number of instances can help prioritize your investigation, but it does not establish whether an object is active or contains sensitive data.

##### Step 3: Inspect an object

When you find a relevant instance, open it in the Object Inspector. Look for fields such as:

```
jdbcUrl
username
password
dataSource
connection
poolName
driverClassName
```

These are illustrative field names; actual names vary across libraries and versions.

Follow references from the configuration object to the data source, pool, or connection objects where possible.

##### Follow references

Use Paths to GC Roots and the object reference tree to determine why an object remains reachable.

For example, a reference chain might conceptually look like:

```
Spring application context
    └── DataSource bean
          └── Hikari connection pool
                └── JDBC connection
```

This is an illustrative chain, not a guaranteed layout. Actual reference paths depend on the framework and runtime state.

A reachable object may be active, cached, idle, or retained for another reason. Interpret it in context.
##### Step 5: Inspect database-related data objects

Search for application-specific classes such as:

```
com.example.app.User
com.example.app.Account
com.example.app.Customer
com.example.app.Session
```

Inspect their fields for potentially sensitive information, such as usernames, email addresses, authentication tokens, session identifiers, or query results.

A Java entity instance is not necessarily a complete database record. It may contain only selected columns, partially loaded relationships, stale data, or transformed values

##### OQL
###### Find datasource-related objects

Start by finding instances of likely datasource and connection-pool classes.

```
SELECT *
FROM OBJECTS
WHERE toString(classof(heapObject)) LIKE "%DataSource%"
```

If your MAT version rejects `heapObject` in that context, use the class-focused query below instead:

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%DataSource%"
```

The second query searches class metadata for names containing `DataSource`. It does not establish that an instance of every matching class exists.

###### Find HikariCP classes

If you previously found Spring datasource configuration and HikariCP-related strings, so search for the associated class metadata:

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%Hikari%"
```

Look for names such as `HikariDataSource`, `HikariConfig`, and `HikariPool`.

What this tells you: Which Hikari-related classes are represented in the heap. You still need to inspect actual instances to determine whether configuration values are present.

###### Find JDBC connection classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%Connection%"
```

This is a broad search and may return many unrelated classes. Refine it by database technology or package name once you know the driver.

For example:

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%h2%"
```

Remember that a class name is not proof of an active connection.

###### Search for Spring datasource configuration classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%DataSourceProperties%"
```

This can help locate Spring Boot configuration-related class metadata. The exact class names depend on the Spring Boot version and which configuration mechanism is used.

##### Find JDBC URL strings

 Search the heap for matching Java `String` objects.

```
SELECT *
FROM java.lang.String s
WHERE s.toString().startsWith("jdbc:")
```

To narrow it to H2:

```
SELECT *
FROM java.lang.String s
WHERE s.toString().contains("jdbc:h2:")
```

These queries are intended to return actual `String` instances, allowing you to inspect the matching value in MAT.

##### Inspect datasource instances and their fields

Finding the class is only the beginning. The next step is to query instances of a class that actually appears in your dump.

For example, if MAT confirms the exact class name is `com.zaxxer.hikari.HikariDataSource`, try:

```
SELECT *
FROM OBJECTS com.zaxxer.hikari.HikariDataSource
```

If your MAT version or OQL engine does not accept that syntax, use the class name shown in the Histogram and use MAT's instance inspection or class-focused query interface instead.

For each returned instance, inspect fields such as:

- `jdbcUrl`
- `username`
- `password`
- `dataSource`
- `poolName`

Field names differ between library versions. Some values may be inherited, held by nested objects, or absent entirely.

###### Search for Spring datasource property strings

You can also locate the property-name strings you found earlier:

```
SELECT *
FROM java.lang.String s
WHERE s.toString().contains("spring.datasource")
```

And:

```
SELECT *
FROM java.lang.String s
WHERE s.toString().contains("DB_PASSWORD")
```

These queries find string objects matching those values. They do not prove that the corresponding property is active or that a secret value is stored alongside it.
#### Database types and their security implications

##### A. Remote databases

Examples include PostgreSQL, MySQL, Oracle, and SQL Server running on separate hosts.

Investigate:
- Internal hostnames and ports.
- Database names and usernames.
- TLS configuration.
- Credential exposure.
- Whether sensitive application data or query results are retained in memory.

A remote-looking JDBC URL does not prove that the database is publicly accessible.

##### B. In-memory databases

H2 and similar databases can operate entirely in memory.

Investigate:
- Database configuration and mode.
- Whether the application stores user records or credentials in memory.
- Whether sensitive records appear in entity objects or query results.
- Whether the database is temporary or has been configured for persistence.

An in-memory database is not automatically secure. Sensitive information can still leak through heap dumps, logs, debugging interfaces, or other memory disclosures.

##### C. File-based databases

Some databases store data in local files.

Investigate:
- Database paths.
- File permissions and ownership, where host access is authorized.
- Whether paths reveal internal directory structures.
- Whether credentials or data appear in the heap independently of the database file.

A path string inside a heap dump does not prove the file currently exists or is accessible.

##### Suggested investigation workflow

1. Validate and preserve the dump. Record its hash, size, source, and collection context.

2. Identify the technology. Search for JDBC URL prefixes, driver names, database libraries, and framework configuration keys.

3. Locate connection objects. Use MAT's Histogram and inspect relevant instances.

4. Establish relationships. Follow references between configuration objects, data sources, pools, and connections.

5. Inspect potentially sensitive data. Determine whether actual credential values, tokens, or database records are present.

6. Assess impact carefully. Separate confirmed disclosure from inferred capability, and avoid claiming access or exploitation without evidence.

7. Document and remediate. Redact secrets, report evidence, restrict heap-dump access, and review why sensitive data was retained or exposed.


### Secrets and Credentials Analysis in Java Heap Dumps

A secret is sensitive information that should only be accessible to authorized people or systems. A credential is information used to establish identity or prove authorization.

| Category              | Examples                                                 | Potential impact if exposed                                                               |
| --------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| User credentials      | Passwords, password hashes, PINs                         | Account compromise, depending on the data and protections                                 |
| API credentials       | API keys, client secrets                                 | Unauthorized API use within the key's permissions                                         |
| Authentication tokens | JWTs, OAuth access tokens, refresh tokens                | Impersonation or access until expiry or revocation, depending on token properties         |
| Session credentials   | Session IDs, session cookies                             | Session hijacking if the value is valid and reusable                                      |
| Cryptographic keys    | Private keys, symmetric encryption keys, signing keys    | Decryption, forgery, or impersonation depending on the key's purpose                      |
| Cloud credentials     | Access keys, service-account tokens                      | Access to cloud resources within the credential's permissions                             |
| Database credentials  | Database usernames and passwords                         | Potential database access if the credentials remain valid and network access is permitted |
| Application secrets   | Signing secrets, webhook secrets, encryption passphrases | Forgery, decryption, or unauthorized integration access                                   |
#### Initial triage with command-line tools

Assume the heap dump is named `heapdump.hprof`.

##### Step 1: Extract readable strings

```bash
strings -a heapdump.hprof > heap-strings.txt
```

##### Step 2:  Search by secret category

Passwords and credential configuration

```bash
grep -inE 'password|passwd|pwd|credential|client_secret|DB_PASSWORD' heap-strings.txt
```

API keys and access tokens

```bash
grep -inE 'api[_-]?key|access_token|refresh_token|client_id|client_secret|Bearer ' heap-strings.txt
```

JWT-related indicators

```bash
grep -inE 'jwt|JsonWebToken|Authorization|Bearer|eyJ' heap-strings.txt
```

Cryptographic material

```bash
grep -inE 'PrivateKey|SecretKey|KeyStore|KeyManager|TrustManager|SSLContext|BEGIN .*PRIVATE KEY' heap-strings.txt
```

Cloud and service credentials

```bash
grep -inE 'AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|GOOGLE_APPLICATION_CREDENTIALS|service.account|client_secret' heap-strings.txt
```

These searches are intentionally broad. A match could be a property name, class name, documentation string, or actual sensitive value.

##### Step 3 Add context around a match

For example:

```bash
grep -in -C 4 'client_secret' heap-strings.txt
```

This displays neighboring strings, which can help with triage. However, adjacent output is not proof that two strings belong to the same object. The heap file is binary, and `strings` flattens readable content without reconstructing the Java object graph.

#### Identify the secret's representation

Sensitive values can be stored in different forms. Understanding the representation helps you choose the right analysis method.

|Representation|Example|Investigation approach|
|---|---|---|
|Java `String`|`"<REDACTED_TOKEN>"`|Search strings and inspect incoming references|
|Character array|`char[]`|Inspect array contents and references in MAT|
|Byte array|`byte[]`|Inspect the array's contents and the owning object's fields|
|Configuration object|`AuthConfig`|Inspect fields and relationships|
|Token object|A library-specific JWT class|Inspect claims, encoded values, and references|
|Cryptographic key object|`SecretKeySpec`, `PrivateKey` implementation|Identify the algorithm and purpose without unnecessarily exposing key material|
|Wrapped secret|Secret manager or credential-provider object|Follow references to determine whether the actual secret is retained locally|

#### Strings versus arrays

Java strings are immutable: once a `String` is created, its contents cannot be modified in place through the normal String API. Replacing a reference with another value does not guarantee that the previous value immediately disappears from memory.

Character or byte arrays can be overwritten by application code, but this does not guarantee that no copies exist elsewhere.

For instance, a password might pass through an input buffer, a `String`, a request object, and a library-specific credential object. Clearing one array does not clear every copy.

Also, the internal representation of a Java `String` varies by Java version and implementation. Avoid assuming that every string is backed by a `char[]`.

#### Analyze secrets in Eclipse MAT

This is where the investigation becomes more reliable. MAT lets you inspect actual instances and references instead of relying only on flattened strings.

##### A. Histogram
Open the Histogram and search for classes associated with authentication, configuration, and cryptography.

Potential targets include:
- `java.lang.String`
- `[B` — byte arrays
- `[C` — character arrays on JVMs that use them
- `java.util.Properties`
- `javax.crypto.spec.SecretKeySpec`
- `java.security.PrivateKey` implementations
- Framework-specific token and credential classes

The Histogram groups instances by class.
##### B. Object Inspector

Select an interesting instance and inspect its fields.

For a hypothetical authentication configuration object:

```
com.example.security.AuthConfig
    apiKey       = <REDACTED>
    clientId     = <CLIENT_ID>
    clientSecret = <REDACTED>
```

##### C. Incoming references

Use the incoming-reference view to discover which objects reference the candidate secret. A hypothetical reference chain might look like this:

```
Application configuration
    └── Authentication provider
          └── Client credentials
                └── Secret value
```

##### D. Paths to GC Roots

Use Path to GC Roots to understand why an object remains reachable. For example, a credential may be retained by a singleton configuration bean, a static field, a long-lived cache, or an HTTP client.

This helps explain retention, not validity. A reachable token might be expired, and an object that appears important might not be used by the application anymore.

##### E. Dominator Tree

The Dominator Tree is particularly useful for identifying objects that retain large portions of memory. It is less useful as a direct secret detector. A token may occupy very little memory yet have significant security implications. Prioritize sensitivity and context, not just retained heap size.


### User Sessions and Authentication Analysis in Java Heap Dumps

How to investigate user sessions, authentication tokens, logged-in users, roles, permissions, and authorization state in a Java heap dump.

#### Authentication

Authentication answers: Who are you?
An application authenticates a user or service using a credential or another identity-verification mechanism. Common authentication methods include:

- Username and password.
- Session cookies.
- JSON Web Tokens (JWTs).
- OAuth 2.0 access tokens.
- Client certificates.
- API keys.
- Single sign-on (SSO).

After authentication, the application may retain information about the authenticated identity in memory. For example, a Java application might have an authentication object conceptually containing:

```
Authentication
├── principal: <USER_ID>
├── authenticated: true
├── authorities
│   ├── ROLE_USER
│   └── ROLE_ADMIN
└── credentials: <REDACTED>
```

A heap dump might contain the authentication object, its principal, associated authorities, or a credential reference. However, finding an authentication object does not automatically prove that the user has an active session or that the credentials remain valid.

#### Authorization

Authorization answers: What are you allowed to do?

After identifying a user, an application determines which resources and operations that identity may access. For example:

|User|Role|Example permissions|
|---|---|---|
|`<USER_A>`|`ROLE_USER`|Read personal profile|
|`<USER_B>`|`ROLE_SUPPORT`|View support records|
|`<USER_C>`|`ROLE_ADMIN`|Manage application accounts|

A heap dump may reveal role names, permission objects, access-control lists, or security configuration. The important questions are:

- Which identity is associated with the role?
- Is the role actually assigned to that identity?
- Does the application use the role for access decisions?
- Is the authorization state current or merely cached?

#### Understanding sessions

A session allows an application to associate multiple requests with a particular client or user. Consider a traditional web application.

1. A user submits login credentials.
2. The server authenticates the user.
3. The server creates or associates a session with the authenticated identity.
4. The client receives a session identifier, often through a cookie.
5. Subsequent requests present that identifier.
6. The server uses the identifier to locate the associated session state.

A common session cookie name in Java web applications is:

```
Cookie: JSESSIONID=<SESSION_ID>
```

The session identifier acts as a reference to server-side state. 
#### What might be retained in memory?

Depending on the server and session implementation, the heap may contain:

- Session objects.
- Session identifiers.
- Authenticated user objects.
- Login timestamps.
- Session creation and last-access timestamps.
- Session attributes.
- Role and permission collections.
- CSRF tokens.
- Authentication-related objects.
- References to HTTP requests or security contexts.

Not all applications store all these values in the same way.

For example, a session may be stored in an external Redis server rather than directly in the application's heap. The application might still retain a session identifier or a temporary copy of some session data.

##### Session identifier versus session object

These are different concepts.

**Session identifier:**

```
<SESSION_ID>
```

A value used to identify or locate a session.

**Session object:**

```
Session
├── id: <SESSION_ID>
├── creationTime: <TIMESTAMP>
├── lastAccessedTime: <TIMESTAMP>
└── attributes
    └── user: <USER_OBJECT>
```

The object layout above is conceptual.

Finding a session identifier does not prove that the corresponding session object exists. Similarly, finding a session object does not prove that a client possesses its identifier.

A session identifier may be security-sensitive because someone who obtains a valid, reusable identifier could potentially impersonate the associated session.

#### What to investigate

For this topic, divide your analysis into five categories.

| Priority | Investigation area                      | Main objective                                                             |
| -------- | --------------------------------------- | -------------------------------------------------------------------------- |
| 1        | Session identifiers and session objects | Identify session-related data and determine what it references             |
| 2        | Authentication tokens                   | Find candidate JWTs, bearer tokens, and other authentication material      |
| 3        | Authenticated users and principals      | Identify user objects and the identities represented in memory             |
| 4        | Roles and authorization state           | Determine how identities relate to roles and permissions                   |
| 5        | Session lifecycle and security context  | Understand authentication-state retention and associated security controls |

These categories overlap. For example, a Spring Security authentication object may contain a principal and authorities, and it may be referenced from a security context associated with a request.

#### Initial triage with command-line tools

##### Search for session-related indicators

```bash
grep -inE 'JSESSIONID|HttpSession|sessionId|session_id|session-id|sessionToken' heap-strings.txt
```

Potential findings include:
- Cookie names.
- Session-related class names.
- Configuration properties.
- Actual session identifier values.
- Logging or debugging messages.

##### Inspect the surrounding output

```bash
grep -in -C 3 'JSESSIONID' heap-strings.txt
```

This can help you identify nearby clues.

##### Search for authentication-related indicators

```bash
grep -inE 'Authentication|SecurityContext|SecurityContextHolder|Principal|UserDetails|authenticated' heap-strings.txt
```

These terms are useful when investigating Java applications that use Spring Security or similar authentication frameworks.

Look for evidence of:
- Authentication interfaces and implementations.
- Security context objects.
- User principal objects.
- Authentication status fields.
- Framework-specific security classes.

##### Search for authentication tokens

```bash
grep -inE 'Authorization|Bearer|access_token|refresh_token|id_token|JWT|JsonWebToken' heap-strings.txt
```

These searches identify possible token-related strings and framework components. An HTTP authorization header might look like:

```
Authorization: Bearer <ACCESS_TOKEN>
```

A real token should be treated as sensitive. Do not paste recovered values into public websites or shared reports.

#### Search for user identity indicators

```bash
grep -inE 'UserDetails|username|userId|user_id|principal|accountId|email' heap-strings.txt
```

Potential findings include:
- Usernames.
- User IDs.
- Email addresses.
- Account identifiers.
- Authentication principal fields.
- User-related class names.

These findings may expose personal information even when no reusable credential is present.

#### Search for roles and permissions

```bash
grep -inE 'ROLE_ADMIN|ROLE_USER|ROLE_SUPERUSER|GrantedAuthority|authorities|permissions|accessControl' heap-strings.txt
```

You may encounter role names, permission constants, or framework classes.

For example:

```
ROLE_USER
ROLE_SUPPORT
ROLE_ADMIN
```


Role names can be valuable architectural clues, but you must establish which user, if any, is associated with a role before drawing conclusions about privilege exposure.

#### Understanding what you found

After the initial searches, classify the results.

|Finding|Possible interpretation|What to verify|
|---|---|---|
|`JSESSIONID`|Session cookie name or related framework constant|Whether an actual identifier or session object exists|
|`HttpSession`|Session API or related object|Whether session instances are present|
|`SecurityContext`|Authentication context type|Whether it contains authentication state|
|`ROLE_ADMIN`|Role name or application constant|Whether it is assigned to a specific principal|
|`Authorization: Bearer`|Authorization-header indicator|Whether an actual token value exists and what references it|
|`UserDetails`|Spring Security user abstraction|Whether relevant instances contain identity or authority data|
|`authenticated=true`|Possible authentication-state indicator|Which object contains the field and what the framework means by it|
|`access_token`|Token-related property or value|Whether it is an actual token and what component owns it|

A reliable analysis moves from a keyword to an actual object and then establishes the object's context.

#### Eclipse MAT analysis

##### Open the heap dump

Begin with the Histogram. Search for likely classes, such as:

```
org.apache.catalina.session.StandardSession
org.springframework.security.core.context.SecurityContextImpl
org.springframework.security.authentication.UsernamePasswordAuthenticationToken
org.springframework.security.core.userdetails.User
```

These are examples of recognizable class names. The actual classes in your dump will depend on the server, framework versions, and application design. If a class is absent, that does not prove sessions or authentication are absent. The application may use different implementations.

##### Inspect session objects

If the Histogram contains a session implementation, inspect its instances. For a Tomcat-based application, one possible class is:

```
org.apache.catalina.session.StandardSession
```

Depending on the version and implementation, useful fields may include:

- Session identifier.
- Creation time.
- Last-access time.
- Session attributes.
- Validity or lifecycle state.
- References to the owning manager or context.

Inspect the session attributes carefully. They may reference user objects, authentication state, or other sensitive information.
##### Example conceptual object graph

```
StandardSession
├── id: <REDACTED_SESSION_ID>
├── creationTime: <TIMESTAMP>
├── lastAccessedTime: <TIMESTAMP>
└── attributes
    ├── user: <USER_OBJECT>
    └── securityContext: <SECURITY_CONTEXT>
```

This is an illustrative graph, not a guaranteed Tomcat layout.

**What you want to establish:** whether a real session instance exists and whether it references security-sensitive objects.

##### Inspect security context objects

Spring Security commonly uses the `SecurityContext` abstraction to hold authentication information. A possible implementation is:

```
org.springframework.security.core.context.SecurityContextImpl
```

Inspect the instance for an authentication reference.

Conceptually:

```
SecurityContext
└── authentication
    ├── principal: <USER_OBJECT>
    ├── authorities: <ROLE_COLLECTION>
    └── authenticated: <BOOLEAN>
```

The actual object structure depends on the authentication implementation.

Questions to investigate:

1. Is there an actual security context instance?
2. Does it reference an authentication object?
3. Does that object reference a principal?
4. Does the principal contain identity information?
5. Are authorities or roles associated with the authentication object?
6. Is the context retained by a session, request, singleton, or another component?

A security context instance may be retained without representing a currently active user session. Interpret the references and application lifecycle together.

##### Inspect principal and user objects

In Spring Security, a principal represents the identity associated with an authentication.

A common implementation is:

```
org.springframework.security.core.userdetails.User
```

Other applications may use a custom principal class, such as:

```
com.example.security.CustomPrincipal
```

Inspect fields that may represent:

- Username or user ID.
- Account status.
- Granted authorities.
- Tenant or organization ID.
- References to a domain user object.

##### Inspect authority and permission objects

Spring Security commonly represents authorities through the `GrantedAuthority` abstraction. One familiar implementation is:

```
org.springframework.security.core.authority.SimpleGrantedAuthority
```

Inspect instances and their associated authority strings.

For example:

```
SimpleGrantedAuthority
└── authority: ROLE_ADMIN
```

To establish that a particular principal has the authority, follow the object references from the authentication object to its authority collection.


#### OQL queries for session and authentication objects

##### Find session-related class metadata

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%Session%"
```

This identifies class metadata with names containing `Session`. It may return many unrelated classes. Use it as a discovery query rather than a definitive session inventory.

##### Find Tomcat session classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%StandardSession%"
```

If the class exists, inspect its instances through the Histogram or by selecting the class in MAT.

#####  Find security context classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%SecurityContext%"
```

Look for framework-specific security context implementations. If an implementation is present, inspect its instances and their authentication references.

##### Find authentication classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%Authentication%"
```

This can identify authentication interfaces and implementations, but it may produce many unrelated matches. Refine the search using the actual class names discovered in your dump.

##### Find user-related classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%User%"
   OR c.@name LIKE "%Principal%"
```

Use the results to identify candidate user or principal classes.

##### Find role and authority classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%GrantedAuthority%"
   OR c.@name LIKE "%SimpleGrantedAuthority%"
```

If matching classes are present, inspect their instances and determine whether they are referenced by authentication objects.

##### Find session-related strings

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE ".*JSESSIONID.*"
   OR s.toString() LIKE ".*sessionId.*"
   OR s.toString() LIKE ".*session_id.*"
```

This finds candidate strings containing session-related identifiers or labels. It does not guarantee that the returned strings are actual session IDs.

##### Find role-related strings

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE "ROLE_.*"
```

This searches for strings beginning with `ROLE_`. Treat the results as indicators. Establish role assignments through the actual authentication and authority objects.

##### Find bearer-token indicators

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE ".*Bearer .*"
```

This can help locate strings containing bearer-token header text. It may miss tokens represented in separate header-name and header-value objects, or in non-string representations.

##### Find JWT-like strings

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE "eyJ.*"
```

This is a basic heuristic. It does not validate the JWT format, signature, issuer, audience, expiration, or usability.

### A practical OQL limitation

These queries help discover classes and strings. They do not automatically reconstruct relationships such as:

```
Session → SecurityContext → Authentication → Principal → Authorities
```

Use MAT's object inspection and reference navigation to establish those relationships. That is the critical part of this investigation.

### API Configuration and Internal Architecture Analysis in Java Heap Dumps

These notes cover how to investigate API endpoints, internal services, HTTP clients, service-to-service communication, authentication headers, and upstream configuration in a Java heap dump.

#### Understanding API configuration and internal architecture

Modern applications rarely operate as a single component. A Java web application may communicate with multiple internal services, external APIs, authentication providers, and data stores.

For example, consider a hypothetical airport application:

```
                         Client
                           |
                           v
                    API Gateway
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
       Service A       Service B      Service C
            |              |              |
            v              v              v
        Database A     Database B     Database C
```


The API gateway receives client requests and forwards appropriate requests to downstream services. Each service may have its own URL, authentication mechanism, configuration, and database.

A Java heap dump can sometimes reveal parts of this architecture because the application may retain configuration objects, URL strings, HTTP clients, request objects, headers, and service credentials in memory.

#### API endpoint

An API endpoint is a network-accessible interface through which a client interacts with an application or service. For example:

```
https://<API_HOST>/api/v1/books
```

Its components are:

| Component    | Meaning                    |
| ------------ | -------------------------- |
| `https://`   | Communication scheme       |
| `<API_HOST>` | Hostname or IP address     |
| `/api/v1`    | API path prefix            |
| `/books      | Resource or operation path |

An endpoint may accept different HTTP methods, such as `GET`, `POST`, `PUT`, or `DELETE`.

#### Upstream service

An upstream service is a service to which an application sends requests. For example:

```
Client
  |
  v
API Gateway
  |
  +----> https://SERVICE_A>/api/libraries
  |
  +----> https://SERVICE_B>/api/books
  |
  +----> https://<AUTH_SERVICE>/oauth/token
```

These destinations might be represented in configuration objects, HTTP clients, or environment-derived properties.

Discovering an internal hostname can help you understand the application's trust boundaries. It does not establish that the hostname resolves, that the service is running, or that your testing machine can reach it.

#### What is a service-to-service credential?

Services often authenticate to other services. Examples include:

- API keys.
- OAuth client credentials.
- Bearer tokens.
- Mutual TLS client certificates.
- Signed requests.
- Service-account credentials.

A Java application might retain a client ID and secret in configuration, then use them to obtain an access token.

Consequently, API configuration analysis overlaps with secrets analysis. Here, the emphasis is on **which service uses the credential, where it sends requests, and how the authentication mechanism fits into the architecture**.

#### What to investigate

Divide the investigation into six categories.

|Priority|Area|Objective|
|---|---|---|
|1|Internal endpoints and upstream URLs|Identify service destinations and API paths|
|2|HTTP clients|Find objects responsible for outbound communication|
|3|Service configuration|Associate URLs with configuration objects and service names|
|4|Service authentication|Identify authentication mechanisms and associated credentials|
|5|Request and response data|Determine whether sensitive information is retained in memory|
|6|Routing and trust boundaries|Understand how services are connected and what security assumptions may exist|

These areas overlap. For example, an HTTP client may retain a base URL, authentication configuration, connection-pool settings, and request headers.

#### Initial triage with command-line tools
We'll use the same workflow as before.
##### Search for URLs

Start by looking for HTTP and HTTPS URLs:

```
grep -inE 'https?://' heap-strings.txt
```

This may reveal strings such as:

```
https://<PUBLIC_API_HOST>/api/v1/
http://<INTERNAL_SERVICE_HOST>:<PORT>/internal/
https://<AUTH_PROVIDER_HOST>/oauth/token
```

##### What to record

For each interesting URL, record:

- Scheme: HTTP or HTTPS.
- Hostname or IP address.
- Port, if explicitly specified.
- Path.
- Query parameters, if present.
- Nearby service or configuration identifiers.

**Important:** A URL may originate from a library, test fixture, documentation, or unused configuration. You must establish its relationship to an actual application object before treating it as an active destination.

##### Search for internal hostnames

```bash
grep -inE 'localhost|127\.0\.0\.1|10\.[0-9]+\.[0-9]+\.[0-9]+|192\.168\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[01])\.' heap-strings.txt
```

This searches for common private IPv4 address patterns and localhost references. It is only a heuristic. It can miss addresses in other formats and produce matches unrelated to service endpoints.  Also search for service-discovery and internal naming terms:

```bash
grep -inE 'upstream|serviceUrl|baseUrl|base-uri|internalHost|serviceName|discovery|gateway' heap-strings.txt
```

Potential findings include configuration property names, internal DNS names, and service identifiers.

##### Search for API paths

```bash
grep -inE '/api/|/v1/|/v2/|/internal/|/admin/|/health|/actuator|/oauth/' heap-strings.txt
```

Other potentially useful terms include:

```
/graphql
/openapi
/swagger
/api-docs
/auth
/token
/authorize
```

##### Search for service names

Search for domain-specific terms relevant to the application.

For an illustrative airport application:

```bash
grep -inE 'flight|boarding|passenger|manifest|gate|terminal|reservation' heap-strings.txt
```

For a generic application, replace these with the service names discovered during reconnaissance.

A useful clue is the association between a service name and a URL. However, a flat string search cannot establish that association reliably.

##### Search for HTTP client libraries

Java applications can use several HTTP client implementations.

```bash
grep -inE 'RestTemplate|WebClient|WebClientBuilder|HttpClient|HttpURLConnection|OkHttpClient|FeignClient|WebTarget' heap-strings.txt
```

Potential libraries and abstractions include:

|Technology|Typical purpose|
|---|---|
|Spring `RestTemplate`|Synchronous HTTP requests|
|Spring `WebClient`|Reactive and nonblocking HTTP requests|
|Java `HttpClient`|Standard Java HTTP client|
|Apache HttpClient|HTTP transport and connection management|
|OkHttp|HTTP client library|
|OpenFeign|Declarative HTTP clients|
|JAX-RS client APIs|Client-side REST communication|


#### Why HTTP client analysis matters

Suppose you find a URL in the dump:

```
http://<INTERNAL_SERVICE_HOST>:<PORT>/api/v1/data
```

By itself, this is a string.

Now suppose MAT shows that the string is referenced by an actual HTTP client configuration object, which is referenced by a service client bean. That establishes a much stronger relationship between the URL and the application's configuration.

It still does not prove that a request was sent successfully, but it helps identify the intended communication path.

#### Analyze service authentication

Service-to-service communication often requires authentication. The main goal is to establish which mechanism is configured and which application component uses it.

##### Search for authentication indicators

```bash
grep -inE 'Authorization|Bearer |Basic |client_id|client_secret|access_token|refresh_token|api[_-]?key' heap-strings.txt
```

Potential results include:

- Header names.
- Authentication scheme labels.
- OAuth configuration properties.
- Actual tokens.
- Client credentials.
- Framework constants.

A match such as `Authorization` does not prove that an authorization header containing a usable credential was captured.

#### Analyze API configuration objects

Frameworks commonly load configuration into Java objects during startup. A configuration object might conceptually contain:

```
ServiceConfig
├── serviceName: <SERVICE_NAME>
├── baseUrl: <SERVICE_URL>
├── connectTimeout: <TIMEOUT>
├── authenticationType: <AUTH_TYPE>
└── credentials: <CREDENTIAL_CONFIG>
```

In a real application, the values may instead be distributed across several objects, environment properties, or external configuration systems.

##### Spring Boot configuration

Look for property names such as:

```
spring.application.name
server.port
spring.security.oauth2.client.registration
spring.security.oauth2.client.provider
```

Custom properties might include:

```
services.flight.base-url
services.boarding.base-url
services.auth.token-url
```


Configuration may be represented as strings, `Properties` objects, environment abstractions, or custom Java objects.

#### Environment variables and system properties

Applications sometimes derive service configuration from environment variables or Java system properties.

Examples include:

```
FLIGHT_SERVICE_URL=<SERVICE_URL>
AUTH_SERVICE_URL=<AUTH_URL>
API_TOKEN=<REDACTED>
```


If a heap dump contains environment-derived values, inspect their context. Do not assume every environment variable is copied into the heap, or that every matching string came from the environment.

#### Eclipse MAT analysis

Command-line searches identify leads. MAT helps determine whether the relevant values belong to actual configuration and client objects.

##### Inspect the Histogram

Search for classes related to HTTP clients, configuration, and service communication. Potential examples include:

```
org.springframework.web.client.RestTemplate
org.springframework.web.reactive.function.client.WebClient
java.net.http.HttpClient
org.apache.hc.client5.http.impl.classic.CloseableHttpClient
okhttp3.OkHttpClient
java.util.Properties
```


#### Inspect candidate HTTP client instances

Select an actual instance and inspect its fields and referenced objects. Depending on the implementation, you may discover:

- Request factory or transport.
- Client configuration.
- Connection manager.
- Interceptors or filters.
- Proxy or TLS configuration.
- Default headers.
- Base URL or destination settings.

Not every HTTP client stores the base URL directly. Declarative clients may store endpoint information in separate proxy or configuration objects.

#### Follow references to configuration

Suppose you discover:

```
FlightServiceClient
    └── configuration
          └── baseUrl: <SERVICE_URL>
```

The important evidence is the actual object relationship.

Next, determine whether the client is referenced by an application component, such as a Spring bean or service object.

A hypothetical chain might be:

```
Application Context
    └── Flight Service
          └── FlightServiceClient
                └── Client Configuration
                      └── Base URL
```


#### Inspect request and response objects

An application may temporarily retain HTTP requests and responses. Search for relevant request types and inspect their fields where present.

Potential sensitive content includes:

- Authorization headers.
- Cookies.
- Query parameters.
- Request bodies.
- Response bodies.
- User identifiers.
- Internal service responses.


#### OQL queries for API configuration and internal architecture

##### Find URL strings

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE "http://.*"
   OR s.toString() LIKE "https://.*"
```

Inspect the results for candidate internal and external URLs. This may return documentation links, library defaults, and unrelated strings.

##### Find strings that resemble internal hostnames

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE ".*localhost.*"
   OR s.toString() LIKE ".*internal.*"
   OR s.toString() LIKE ".*service.*"
   OR s.toString() LIKE ".*upstream.*"
```

This broad query can produce many false positives. Refine it using actual service names and URL patterns discovered in the dump.

##### Find HTTP client class metadata

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%HttpClient%"
   OR c.@name LIKE "%RestTemplate%"
   OR c.@name LIKE "%WebClient%"
   OR c.@name LIKE "%OkHttpClient%"
```

This searches for class metadata associated with common HTTP clients.

##### Find service configuration classes

```
SELECT *
FROM java.lang.Class c
WHERE c.@name LIKE "%Config%"
   OR c.@name LIKE "%Properties%"
```

This is intentionally broad. Many classes contain `Config` or `Properties` in their names. Use it to discover candidates, then refine the query with package names or actual classes identified in the Histogram.

##### Find authentication-related strings

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE ".*Authorization.*"
   OR s.toString() LIKE ".*Bearer .*"
   OR s.toString() LIKE ".*client_secret.*"
   OR s.toString() LIKE ".*access_token.*"
```

This helps locate authentication-related strings. It does not establish that an HTTP client uses them.

##### Find routing-related strings

```
SELECT *
FROM java.lang.String s
WHERE s.toString() LIKE ".*\\/api\\/.*"
   OR s.toString() LIKE ".*\\/internal\\/.*"
   OR s.toString() LIKE ".*\\/oauth\\/.*"
```

This searches for common API path patterns. Exact matching behavior depends on MAT's regular-expression implementation, so adjust the expressions if your installed version behaves differently.

### Conclusion

Heap dump analysis is a valuable skill in cybersecurity because it provides insight into an application's internal state while it is running. By examining memory, an analyst can uncover exposed secrets, authentication artifacts, database configurations, internal services, and other sensitive information that may not be visible through normal application interactions.

A successful investigation requires more than searching for keywords. It involves understanding the JVM, examining object relationships, tracing references, and validating findings against available evidence. Combining command-line tools with Eclipse MAT makes it easier to identify meaningful artifacts and determine their potential security impact.

Ultimately, the goal is to turn raw memory data into actionable security findings while maintaining accuracy, protecting sensitive information, and clearly distinguishing confirmed vulnerabilities from unverified possibilities.

