# GeoCompress
Compression and decompression technique for chronological geographic data

## Summary and Motivation
Being a fan of maps and history, I've seen my fair share of online atlases. However, I am consistently disappointed by their implementations. More often than not, my user experience is constrained by how long it takes to navigate from year to year, as borders reload, even if they only cahnge slightly, if at all. This often stems from redundancy in transmitting the the same vertex data over and over, simply to account for tiny variations in borders.

## Analysis of Potential Solutions:
There are several possible improvements which revolve around the same concept: recycling old vertex data which is still relevant. For both my analysis and my implementation, use vertex data describing the political borders of the United States at ten year intervals from 1790 to 1880. 

Let us consider one key case, in which the client has already downloaded and displayed data from 1880 and now wishes to do the same for 1790.

It is readily apparent that there is significant redundancy if the server were to transmit both data sets in full, as most of the borders which existed in 1790 continued to exist in some form by 1880. To better illustrate this, I represented the data from each year as a set of points, such that the difference of the two sets could be easily determined. Impressively, only 7,826 out of  482,186 vertices in the 1790 data are not elements of the 1880 data. This implies that, if we were to transmit the data from 1790 in full, 98.4% (19.6MB) would be redundant. This offers a tantalizing potential for significant compression, which could increase responsivity while significantly decreasing the financial cost of transmitting the data.

While it is trivial to determine the set of points which are unique to a given set and the intersection of two sets, efficiently developing a way to efficiently represent and reconstruct this data is more difficult. I will undertake this in the next section.

## One Solution:

My particular solution uses the following process for server-side compression and client-side reconstruction:

### Parameters:

* Old data: one year’s worth of vertex data which the client has already downloaded, will be used for compression and decompression.
* New data: one year’s worth of vertex data which the client wishes to download, will be compressed server-side and decompressed client-side.

### Method:

1. Construct a linked set of vertices using a hash table for both the old data and new data, such that each vertex in the set has a previous (consecutive) vertex and a next (also consecutive vertex).
1. Traverse the coordinate data of each new state, such that each coordinate is classified as a hook, line, or junk (all I could think of was a fishing analogy, for some reason).

    1. Junk: 

       A coordinate in the new year is said to be junk if it does not exist in the set of vertices for the old year.

       Example:

        > A = [[0,0], [1,1]] 

        > B = [[0,1], [1,0]]

        Both vertices in B are junk.

    1. Hook: 

        A coordinate in the new year is said to be a hook if it exists in the set of vertices for the old year and the previous vertex in the new set is not equivalent to the previous vertex in the old set.

        Example (assume A and B are ordered): 

        > A = [[0,0], [1,1]]

        > B = [[0,1], [0,0]]

        B[1] is classified as a hook because B[1] is an element of A (at index 0) but B[0] != A[-1] (the vertex preceding A[0]).

     1. Line : 

        A coordinate in the new year is said to be a line (or exist on a line) if it exists in the set of vertices for the old year and the previous vertex in the new set is equivalent to the previous vertex in the old set.
        Example (assume A and B are ordered): 

        > A = [[0,0], [1,1]]

        > B = [[0,0], [1,1]]

        B[1] is classified as a line because B[1] is an element of A (at index 1) and B[0] = A[0] (the vertex preceding A[1])

        Note that every line element must be preceded by either another line element or a hook element. Thus, every line element must be associated with a hook.

1. Define a resulting list of compressed consecutive vertices such that each element is either a vertex (implying that that vertex is junk and does not exist in the old year) or an object which contains the hook’s coordinate data and the length of the line following it, as well as the state in which it exists in the old data set.
1. (Client side) For each element in the compressed list, if that element is a vertex, add that vertex to a linked list. If that element is an hook-line object, locate the hook in its source state, then add the hook vertex to the linked list, as well as every consequent vertex within the length of the line (i.e. the next  n vertices).

This process results in a linked list of consecutive vertices for each state, equivalent to the data we could have transmitted directly. Therefore, the compression is lossless.

## Implementation and Analysis

### Linked Vertex Hash Set

Because mutable objects are not hashable in Python, it was necessary to implement a linked vertex hash set from scratch. The advantage of this unusual data structure is that it can be sequentially traversed, but a search operation can be accomplished in constant time. This means that more complex operations such as set unions, differences, and intersections can be accomplished in linear time. This can be explained intuitively by considering that each of these operations requires that a set be traversed a constant number of times, with each element in the list requiring a search. If each search is O(1), the overall time complexity for a set will be O(n). In a list, these operations would be O(n^2) time complexity, as each search would run in O(n) time.

### Decomposition algorithm

The decomposition contains two major steps, both of which run in linear time. First, the linked vertex hash set must be constructed for each data set. For a data data set with  n  vertices, this will require  n  additions, each of which runs in constant time, yielding overall linear time. The second major step is compressing the new data based on the old data. This requires traversing the new data, once, including a constant number of searches and comparisons for each element. Thus, this step will also run in linear time.

### Reconstruction Algorithm

Reconstruction time complexity will depend on the number of hooks in the compressed data, as well as the average number of vertices in a state. For each vertex in the compressed data, a constant-time append operation is required. However, for every hook-line object, one linear time search must be completed for the source state. Thus, the time complexity of decompression will be proportional to the number of hooks times the average number of vertices in a state. This could conceivably be improved by constructing another linked vertex hash set.

## Results:

Some data grooming was necessary to bring this project to a manageable scale. First, each state’s vertex data was trimmed, such that only contiguous land is included in the data. This offers room for the algorithm to be further developed, such that it can identify and handle states with multiple, unconnected territories.

Compression of the 1790 data using the 1880 data produced a 4.1MB JSON file which was successfully reconstructed on the client side and ultimately identical to the original file. This represents a compression rate of 79.4%, which does not match our theoretical maximum for lossless compression, but is still an excellent improvement.

The compression rate for 1840 data was even more impressive, with a smaller compressed file size (3.2MB) despite a larger data set (34.4MB), representing a compression rate of about 90.7%.

I hypothesize that the difference in theoretical and observed compression rates comes from a flaw in my algorithm - it only probes in one direction. If the Virginia data defines the VA-NC border from west to east and North Carolina defines the same border from east to west, these borders cannot currently reference each other using a hook-line object.

## Guidelines for Practical Application:

While the compression algorithm runs in linear time, the large number of vertices in some datasets can produce long run-times. In a practical context, it is probably best that these compressed files be precomputed and stored, rather than produced as needed.

The problem of efficient compression becomes significantly more complex when the client has downloaded more than one year’s worth of data. The simplest efficient solution to this is to simply use the set intersection method to determine which old set shares the most vertices with the new set. A more sophisticated solution would create a joint set of vertices which could be referenced - this is beyond the scope of my implementation.

The United States is somewhat unique in that its borders tend to grow over time, without changing existing borders significantly. In this case, I believe the optimal solution for network load and time-complexity is to precompute all compressed files in terms of 1880, which should be downloaded as the page loads. This may not apply to other countries, but a similar approach may be appropriate for a world map.

An ideal implementation would load vertex data as needed, based on the zoom level - e.g. a zoomed in view of Africa would require only African vertex data with relatively high precision. A zoomed out view of the world would require all the vertex data for that year, but with less precision. Either way, space is conserved.
